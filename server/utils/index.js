import { fileURLToPath, URL } from 'url'

export const UPLOAD_DIR = '../public/upload'
export const UPLOAD_CACHE = '../public/cache'

export const initPath = (dir, file) => {
  const fileDir = file ? `/${file}` : ''
  return fileURLToPath(new URL(`${dir}${fileDir}`, import.meta.url))
}
