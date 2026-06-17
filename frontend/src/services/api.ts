export const askQuestion = async (query: string) => {
  const response = await fetch('http://localhost:8000/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) throw new Error('Failed to fetch response');
  return response.json();
};

export const uploadPdf = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/upload_pdf', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
};
