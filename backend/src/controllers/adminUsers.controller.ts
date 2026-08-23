import { Request, Response } from "express";
import { User } from "../models/User";
import { HOMEPAGE_PERMISSIONS, HomepagePermission } from "../config/permissions";
import { HomepageAuditLog } from "../models/HomepageAuditLog";
import { z } from "zod";

const permissionsSchema = z.object({
  permissions: z.array(z.enum(HOMEPAGE_PERMISSIONS as any)),
});

export const getUserHomepagePermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("permissions role fullName email");
    
    if (!user) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
    }

    return res.json({
      success: true,
      data: {
        permissions: user.permissions || [],
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      }
    });
  } catch (error) {
    console.error("getUserHomepagePermissions error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const updateUserHomepagePermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-escalation
    if (userId === req.user?.userId) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You cannot modify your own permissions" } });
    }

    const parseResult = permissionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid permissions list" } });
    }

    const newPermissions = parseResult.data.permissions;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
    }

    // Do not allow modifying SuperAdmin permissions
    if (user.role === "SuperAdmin") {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot modify permissions of a SuperAdmin" } });
    }

    const oldPermissions = user.permissions || [];
    
    // Determine grants and revokes for audit log
    const granted = newPermissions.filter((p: string) => !oldPermissions.includes(p));
    const revoked = oldPermissions.filter((p: string) => !newPermissions.includes(p as any));

    user.permissions = newPermissions;
    await user.save();

    // Audit logs
    const auditLogs = [];
    const actorId = req.user?.userId || "system";
    const actorRole = req.user?.role || "system";

    for (const perm of granted) {
      auditLogs.push({
        action: "PERMISSION_GRANT",
        actorId,
        actorRole,
        metadata: { targetUserId: user.id, targetUserEmail: user.email, permission: perm },
      });
    }
    
    for (const perm of revoked) {
      auditLogs.push({
        action: "PERMISSION_REVOKE",
        actorId,
        actorRole,
        metadata: { targetUserId: user.id, targetUserEmail: user.email, permission: perm },
      });
    }

    if (auditLogs.length > 0) {
      await HomepageAuditLog.insertMany(auditLogs);
    }

    return res.json({
      success: true,
      data: {
        permissions: user.permissions,
        message: "Permissions updated successfully"
      }
    });
  } catch (error) {
    console.error("updateUserHomepagePermissions error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};
