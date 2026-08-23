"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserHomepagePermissions = exports.getUserHomepagePermissions = void 0;
const User_1 = require("../models/User");
const permissions_1 = require("../config/permissions");
const HomepageAuditLog_1 = require("../models/HomepageAuditLog");
const zod_1 = require("zod");
const permissionsSchema = zod_1.z.object({
    permissions: zod_1.z.array(zod_1.z.enum(permissions_1.HOMEPAGE_PERMISSIONS)),
});
const getUserHomepagePermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.User.findById(userId).select("permissions role fullName email");
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
    }
    catch (error) {
        console.error("getUserHomepagePermissions error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.getUserHomepagePermissions = getUserHomepagePermissions;
const updateUserHomepagePermissions = async (req, res) => {
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
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
        }
        // Do not allow modifying SuperAdmin permissions
        if (user.role === "SuperAdmin") {
            return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot modify permissions of a SuperAdmin" } });
        }
        const oldPermissions = user.permissions || [];
        // Determine grants and revokes for audit log
        const granted = newPermissions.filter((p) => !oldPermissions.includes(p));
        const revoked = oldPermissions.filter((p) => !newPermissions.includes(p));
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
            await HomepageAuditLog_1.HomepageAuditLog.insertMany(auditLogs);
        }
        return res.json({
            success: true,
            data: {
                permissions: user.permissions,
                message: "Permissions updated successfully"
            }
        });
    }
    catch (error) {
        console.error("updateUserHomepagePermissions error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.updateUserHomepagePermissions = updateUserHomepagePermissions;
