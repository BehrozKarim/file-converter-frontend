"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, X, Download, FileText, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ConversionType {
  id: string
  label: string
  from: string
  to: string
  type: string
}

interface FileConverterProps {
  conversionType: ConversionType
}

interface ConvertedFile {
  id: string
  name: string
  originalFile: File
  convertedUrl?: string
  status: "pending" | "converting" | "completed" | "error"
  error?: string
}

export function FileConverter({ conversionType }: FileConverterProps) {
  const [files, setFiles] = useState<ConvertedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getApiEndpoint = () => {
    const isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost"
    const baseUrl = isDevelopment
      ? process.env.NEXT_PUBLIC_API_URL_DEV || "http://localhost:8000"
      : process.env.NEXT_PUBLIC_API_URL_PROD || "https://your-production-api.com"
    return `${baseUrl}/api/${conversionType.type}/${conversionType.id}`
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    const newFiles: ConvertedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      originalFile: file,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const convertFile = async (file: ConvertedFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "converting" } : f)))
    try {
      const formData = new FormData()
      formData.append("file", file.originalFile)
      const response = await fetch(getApiEndpoint(), {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`)
      }
      const blob = await response.blob()
      const convertedUrl = URL.createObjectURL(blob)
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "completed", convertedUrl } : f)))
      toast({
        title: "Conversion completed",
        description: `${file.name} has been converted successfully.`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: errorMessage } : f)))
      toast({
        title: "Conversion failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const convertAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await convertFile(file)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const clearQueue = () => {
    setFiles([])
  }

  const downloadFile = (file: ConvertedFile) => {
    if (!file.convertedUrl) return
    const link = document.createElement("a")
    link.href = file.convertedUrl
    link.download = `${file.name.split(".")[0]}.${conversionType.to}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = () => {
    const completedFiles = files.filter((f) => f.status === "completed" && f.convertedUrl)
    completedFiles.forEach((file) => downloadFile(file))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "webp", "heic"].includes(extension || "")) {
      return <ImageIcon className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  const getInstructions = () => {
    const maxFiles = conversionType.from === "images" ? "up to 20" : "up to 10"
    const fileTypes = conversionType.from === "images" ? "image files" : `${conversionType.from.toUpperCase()} files`
    return {
      title: `${conversionType.label} Conversion`,
      description: `This free online tool converts your ${fileTypes} to ${conversionType.to.toUpperCase()} format, applying proper compression methods. Unlike other services, this tool does not ask for your email address, offers mass conversion and allows files up to 50 MB.`,
      step1: `Click the UPLOAD FILES button and select ${maxFiles} ${fileTypes} you wish to convert. You can also drag files to the drop area to start uploading.`,
      step2: `Take a break now and let our tool upload your files and convert them one by one, automatically choosing the proper compression parameters for every file.`,
    }
  }

  const instructions = getInstructions()
  const completedCount = files.filter((f) => f.status === "completed").length

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{instructions.title}</h1>
        <p className="text-gray-600 leading-relaxed">{instructions.description}</p>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              1
            </span>
            <p className="text-gray-600">{instructions.step1}</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              2
            </span>
            <p className="text-gray-600">{instructions.step2}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
          <Upload className="w-4 h-4 mr-2" />
          UPLOAD FILES
        </button>
        <button onClick={clearQueue} className="btn btn-outline">
          <X className="w-4 h-4 mr-2" />
          CLEAR QUEUE
        </button>
        {files.some((f) => f.status === "pending") && (
          <button onClick={convertAllFiles} className="btn btn-success">
            CONVERT ALL
          </button>
        )}
      </div>

      <div
        className={`card card-dashed p-12 text-center transition-all ${isDragOver ? "drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center justify-between">
          <ChevronLeft className="w-8 h-8 text-gray-300" />
          <div className="flex-1">
            <p className="text-xl text-gray-400 mb-4">Drop Your Files Here</p>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.name)}
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className={`status-badge status-${file.status}`}>{file.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === "pending" && (
                        <button onClick={() => convertFile(file)} className="btn btn-primary btn-sm">
                          Convert
                        </button>
                      )}
                      {file.status === "completed" && file.convertedUrl && (
                        <button onClick={() => downloadFile(file)} className="btn btn-success btn-sm">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => removeFile(file.id)} className="btn btn-secondary btn-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ChevronRight className="w-8 h-8 text-gray-300" />
        </div>
      </div>

      {completedCount > 0 && (
        <div className="text-center">
          <button onClick={downloadAll} className="btn btn-gray">
            <Download className="w-4 h-4 mr-2" />
            DOWNLOAD ALL ({completedCount})
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={
          conversionType.from === "images"
            ? "image/*"
            : conversionType.from === "pdf"
              ? ".pdf"
              : conversionType.from === "word"
                ? ".doc,.docx"
                : "*"
        }
      />
    </div>
  )
}
