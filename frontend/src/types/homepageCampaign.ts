export type HomepageCampaignStatus = "draft" | "scheduled" | "active" | "completed" | "cancelled" | "executing";

export interface HomepageCampaign {
  _id: string;
  campaignKey: string;
  name: string;
  description?: string;
  revisionId: number;
  status: HomepageCampaignStatus;
  startsAt?: string;
  endsAt?: string;
  fallbackRevisionId?: number;
  createdBy: string;
  scheduledBy?: string;
  activatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  campaignKey: string;
  name: string;
  description?: string;
  revisionId: number;
  startsAt?: string;
  endsAt?: string;
  fallbackRevisionId?: number;
}
