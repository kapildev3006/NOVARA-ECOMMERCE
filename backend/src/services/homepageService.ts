import mongoose, { ClientSession } from "mongoose";
import { HomepageSection } from "../models/HomepageSection";
import { HomepageRevision } from "../models/HomepageRevision";

export const applyRevisionToLiveHomepage = async (revisionId: number, session: ClientSession) => {
  // 1. Fetch the revision
  const revision = await HomepageRevision.findOne({ revisionId }).session(session);
  if (!revision) {
    throw new Error(`Revision ${revisionId} not found`);
  }

  // 2. Prepare bulk write operations to atomically replace the live homepage
  const bulkOps: any[] = [];
  
  // We want to delete any live sections that are no longer in the revision
  const revisionSectionIds = revision.sections.map((s: any) => s._id.toString());
  bulkOps.push({
    deleteMany: {
      filter: { _id: { $nin: revisionSectionIds } }
    }
  });

  // We upsert all revision sections to the live collection
  for (const sec of revision.sections) {
    bulkOps.push({
      updateOne: {
        filter: { _id: sec._id },
        update: { $set: sec.toObject() },
        upsert: true
      }
    });
  }

  // 3. Execute bulk write
  await HomepageSection.bulkWrite(bulkOps, { session });
};
