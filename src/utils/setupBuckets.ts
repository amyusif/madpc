import { supabase } from "@/integrations/supabase/client";

export async function createStorageBuckets() {
  const buckets = [
    {
      id: "user-profiles",
      name: "user-profiles",
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    },
    {
      id: "personnel-photos",
      name: "personnel-photos", 
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    },
    {
      id: "case-evidence",
      name: "case-evidence",
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        "image/jpeg", "image/jpg", "image/png", "image/webp",
        "application/pdf",
        "video/mp4", "video/webm",
        "audio/mp3", "audio/wav"
      ],
    },
    {
      id: "documents",
      name: "documents",
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ],
    },
    {
      id: "reports",
      name: "reports",
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ],
    },
    {
      id: "imports",
      name: "imports",
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
    },
  ];

  const results = [];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some(b => b.id === bucket.id);

      if (!bucketExists) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes,
        });

        if (error) {
          console.error(`Failed to create bucket ${bucket.id}:`, error);
          results.push({ bucket: bucket.id, success: false, error: error.message });
        } else {
          console.log(`Created bucket: ${bucket.id}`);
          results.push({ bucket: bucket.id, success: true });
        }
      } else {
        console.log(`Bucket ${bucket.id} already exists`);
        results.push({ bucket: bucket.id, success: true, message: "Already exists" });
      }
    } catch (error) {
      console.error(`Error with bucket ${bucket.id}:`, error);
      results.push({ 
        bucket: bucket.id, 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }

  return results;
}

export async function checkBucketExists(bucketId: string): Promise<boolean> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    return buckets?.some(bucket => bucket.id === bucketId) || false;
  } catch (error) {
    console.error("Error checking bucket:", error);
    return false;
  }
}
