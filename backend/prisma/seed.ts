import { CampaignStatus, Platform, PrismaClient, SubmissionStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const creator = await prisma.user.upsert({
    where: { email: "creator@clipso.dev" },
    update: { name: "Creator Demo", role: UserRole.CREATOR },
    create: {
      email: "creator@clipso.dev",
      name: "Creator Demo",
      role: UserRole.CREATOR,
    },
  });

  const clipper = await prisma.user.upsert({
    where: { email: "clipper@clipso.dev" },
    update: { name: "Clipper Demo", role: UserRole.CLIPPER },
    create: {
      email: "clipper@clipso.dev",
      name: "Clipper Demo",
      role: UserRole.CLIPPER,
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: "camp_seed_001" },
    update: {
      title: "Podcast Shorts Launch",
      description: "Weekly short-form clips from podcast highlights",
      budgetCents: 300000,
      status: CampaignStatus.LIVE,
      creatorId: creator.id,
    },
    create: {
      id: "camp_seed_001",
      title: "Podcast Shorts Launch",
      description: "Weekly short-form clips from podcast highlights",
      budgetCents: 300000,
      status: CampaignStatus.LIVE,
      creatorId: creator.id,
    },
  });

  const submission = await prisma.submission.upsert({
    where: { id: "sub_seed_001" },
    update: {
      campaignId: campaign.id,
      clipperId: clipper.id,
      sourceUrl: "https://www.youtube.com/shorts/abc123seed",
      platform: Platform.YOUTUBE_SHORTS,
      status: SubmissionStatus.APPROVED,
      payoutCents: 4500,
      caption: "Podcast growth hack clip",
    },
    create: {
      id: "sub_seed_001",
      campaignId: campaign.id,
      clipperId: clipper.id,
      sourceUrl: "https://www.youtube.com/shorts/abc123seed",
      platform: Platform.YOUTUBE_SHORTS,
      status: SubmissionStatus.APPROVED,
      payoutCents: 4500,
      caption: "Podcast growth hack clip",
    },
  });

  await prisma.socialPost.upsert({
    where: {
      platform_externalPostId: {
        platform: Platform.YOUTUBE_SHORTS,
        externalPostId: "abc123seed",
      },
    },
    update: {
      submissionId: submission.id,
      postUrl: "https://www.youtube.com/shorts/abc123seed",
      handle: "@clipso_demo",
    },
    create: {
      submissionId: submission.id,
      platform: Platform.YOUTUBE_SHORTS,
      externalPostId: "abc123seed",
      postUrl: "https://www.youtube.com/shorts/abc123seed",
      handle: "@clipso_demo",
    },
  });

  console.log("Seed complete: creator + clipper + campaign + submission");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
