import { Request, Response } from 'express';

import { generatePresignedUrl } from '@/shared/core/s3/s3.service.js';

export const generateS3PresignedUrl = async (req: Request, res: Response): Promise<void> => {
  const { schema, fileName, contentType } = req.body;
  const userId = req.user?.id;

  try {
    const { url, key, id } = await generatePresignedUrl({
      schema,
      fileName,
      userId,
      contentType,
    });

    res.json({ url, key, id });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ error: 'Error generating pre-signed URL.' });
  }
};
