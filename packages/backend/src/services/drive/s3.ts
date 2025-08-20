import { S3Client } from "@aws-sdk/client-s3";
import { Meta } from "@/models/entities/meta.js";

export function getS3(meta: Meta) {
    return new S3Client({
        endpoint: meta.objectStorageEndpoint?.startsWith("https://") || meta.objectStorageEndpoint?.startsWith("http://")
            ? meta.objectStorageEndpoint 
            : meta.objectStorageUseSSL ? `https://${meta.objectStorageEndpoint}` : `http://${meta.objectStorageEndpoint}`,
        credentials: {
            accessKeyId: meta.objectStorageAccessKey!,
            secretAccessKey: meta.objectStorageSecretKey!,
        },
        region: meta.objectStorageRegion || "auto",
        forcePathStyle: meta.objectStorageS3ForcePathStyle,
        tls: meta.objectStorageUseSSL,
    });
}
