import { DATA_PROVIDER, supabase } from './supabase';
import type { PolicyAttachment } from '../types/policy.types';

const bucketName = 'policy-attachments';

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const resolveAttachmentUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
};

export const uploadPolicyAttachment = async (
  policyId: string,
  file: File,
  uploadedBy?: string
) => {
  const fileName = file.name;
  const fileType = file.type || null;
  const fileSize = file.size || null;

  if (DATA_PROVIDER === 'local') {
    const filePath = await fileToDataUrl(file);
    const { data, error } = await supabase
      .from('policy_attachments')
      .insert({
        policy_id: policyId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as PolicyAttachment;
  }

  const objectPath = `${policyId}/${Date.now()}-${fileName.replace(/\s+/g, '-').toLowerCase()}`;
  const uploadResponse = await supabase.storage.from(bucketName).upload(objectPath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadResponse.error) throw uploadResponse.error;

  const { data, error } = await supabase
    .from('policy_attachments')
    .insert({
      policy_id: policyId,
      file_name: fileName,
      file_path: objectPath,
      file_size: fileSize,
      file_type: fileType,
      uploaded_by: uploadedBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PolicyAttachment;
};

export const deletePolicyAttachment = async (attachment: PolicyAttachment) => {
  if (DATA_PROVIDER !== 'local' && attachment.file_path && !attachment.file_path.startsWith('http')) {
    await supabase.storage.from(bucketName).remove([attachment.file_path]);
  }
  const { error } = await supabase.from('policy_attachments').delete().eq('id', attachment.id);
  if (error) throw error;
};
