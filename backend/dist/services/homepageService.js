"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRevisionToLiveHomepage = void 0;
const HomepageSection_1 = require("../models/HomepageSection");
const HomepageRevision_1 = require("../models/HomepageRevision");
const applyRevisionToLiveHomepage = async (revisionId, session) => {
    // 1. Fetch the revision
    const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId }).session(session);
    if (!revision) {
        throw new Error(`Revision ${revisionId} not found`);
    }
    // 2. Prepare bulk write operations to atomically replace the live homepage
    const bulkOps = [];
    // We want to delete any live sections that are no longer in the revision
    const revisionSectionIds = revision.sections.map((s) => s._id.toString());
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
    await HomepageSection_1.HomepageSection.bulkWrite(bulkOps, { session });
};
exports.applyRevisionToLiveHomepage = applyRevisionToLiveHomepage;
