/**
 * services/materialService.ts
 * Download de materiais complementares do curso.
 */
export const downloadMaterial = async (fileUrl: string): Promise<string> => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Falha ao baixar o arquivo (${response.status})`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
