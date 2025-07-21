import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true)
    
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('product-image-upload', {
        body: {
          imageData: base64Data,
          fileName: file.name
        }
      })

      if (error) throw error
      
      toast.success('Image uploaded successfully!')
      return data.data.publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
      throw error
    } finally {
      setUploading(false)
    }
  }

  return { uploadImage, uploading }
}
