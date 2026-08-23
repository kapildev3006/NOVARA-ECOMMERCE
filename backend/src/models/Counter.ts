import mongoose, { Document, Schema } from "mongoose";

export interface ICounter extends mongoose.Document<string> {
  _id: string; // The counter key (e.g., "homepageRevision")
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

export async function getNextSequence(counterName: string, session?: mongoose.ClientSession): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    counterName,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, session }
  );
  return counter.sequence;
}
