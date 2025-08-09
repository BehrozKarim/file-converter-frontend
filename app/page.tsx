"use client"

import { useState } from "react"
import { FileConverter } from "@/components/file-converter"
import { Header } from "@/components/header"

const conversionTypes = [
  { id: "images-to-pdf", label: "Images to PDF", from: "images", to: "pdf", type: "documents" },
  { id: "pdf-to-images", label: "PDF to Images", from: "pdf", to: "images", type: "documents" },
  { id: "pdf-to-word", label: "PDF to Word", from: "pdf", to: "word", type: "documents" },
  { id: "word-to-pdf", label: "Word to PDF", from: "word", to: "pdf", type: "documents" },
  { id: "jpg-to-png", label: "JPG to PNG", from: "jpg", to: "png", type: "images" },
  { id: "png-to-jpg", label: "PNG to JPG", from: "png", to: "jpg", type: "images" },
  { id: "jpg-to-heic", label: "JPG to HEIC", from: "jpg", to: "heic", type: "images" },
  { id: "jpg-to-webp", label: "JPG to WebP", from: "jpg", to: "webp", type: "images" },
  { id: "webp-to-jpg", label: "WebP to JPG", from: "webp", to: "jpg", type: "images" },
  { id: "heic-to-jpg", label: "HEIC to JPG", from: "heic", to: "jpg", type: "images" },
]

export default function Home() {
  const [activeConversion, setActiveConversion] = useState(conversionTypes[4])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {conversionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveConversion(type)}
                  className={`btn transition-colors ${
                    activeConversion.id === type.id ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <FileConverter conversionType={activeConversion} />
        </div>
      </main>
    </div>
  )
}
