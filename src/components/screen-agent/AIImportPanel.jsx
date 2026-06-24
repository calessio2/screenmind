import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Sparkles, Loader2, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AIImportPanel({ onGenerated, onClose }) {
  const [rawText, setRawText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
    e.target.value = "";
  };

  const handleImagesSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ file, url: file_url });
      }
      setImages((prev) => [...prev, ...uploaded.map((u) => u.file)]);
      setImageUrls((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError("Error al subir imágenes");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!rawText.trim() && !pdfFile && imageUrls.length === 0) return;
    setGenerating(true);
    setError("");
    try {
      let pdfUrl = null;
      if (pdfFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
        pdfUrl = file_url;
      }

      const fileUrls = [...imageUrls];
      if (pdfUrl) fileUrls.push(pdfUrl);

      const hasImages = imageUrls.length > 0;
      const imageInstructions = hasImages
        ? `\nSe adjuntaron ${imageUrls.length} imágenes en orden. Asigná cada imagen al paso correspondiente usando "image_index" (0-based, null si no corresponde ninguna). Mantené el orden lógico de las imágenes.`
        : "";

      const prompt = `Sos un asistente que estructura procesos corporativos a partir de material de origen. Analizá el contenido proporcionado (texto${pdfFile ? ", PDF" : ""}${hasImages ? " e imágenes" : ""}) y generá un proceso estructurado paso a paso.

${rawText.trim() ? `Texto plano del usuario:\n${rawText.trim()}\n` : ""}
${imageInstructions}

Reglas:
- Generá un título claro y conciso.
- Escribí una descripción breve del proceso.
- Inferí el software y categoría si se pueden deducir del contenido.
- Generá palabras clave separadas por comas.
- Dividí el proceso en pasos lógicos y secuenciales.
- Cada paso debe tener un título corto y una descripción con la instrucción detallada.
- Si hay imágenes, asignalas a los pasos correspondientes manteniendo el orden.
- Todo en español.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            software: { type: "string" },
            category: { type: "string" },
            keywords: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  image_index: { type: "number", description: "Índice (0-based) de la imagen asignada, o null si ninguna" }
                }
              }
            }
          },
          required: ["title", "steps"]
        },
        model: "claude_sonnet_4_6",
      });

      const generatedSteps = (response.steps || []).map((step) => ({
        title: step.title || "",
        description: step.description || "",
        image_url: step.image_index != null && imageUrls[step.image_index] ? imageUrls[step.image_index] : "",
      }));

      onGenerated({
        title: response.title || "",
        description: response.description || "",
        software: response.software || "",
        category: response.category || "",
        keywords: response.keywords || "",
        steps: generatedSteps,
      });
    } catch (err) {
      setError("Error al generar el proceso con IA. Intentá de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = (rawText.trim() || pdfFile || imageUrls.length > 0) && !uploading;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-xs text-purple-300">
          Subí un PDF, pegá texto plano o agregá imágenes. La IA estructurará el proceso automáticamente y podrás revisarlo antes de guardar.
        </p>
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Texto plano</label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Pegá acá el contenido del manual, procedimiento o documentación..."
          rows={5}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600/50 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">PDF de origen</label>
        <input type="file" ref={fileInputRef} accept=".pdf" onChange={handlePdfSelect} className="hidden" />
        {pdfFile ? (
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5">
            <FileText className="w-4 h-4 text-red-400" />
            <span className="text-sm text-zinc-200 flex-1 truncate">{pdfFile.name}</span>
            <button onClick={() => setPdfFile(null)} className="text-zinc-500 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Subir PDF
          </button>
        )}
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Imágenes de referencia</label>
        <input type="file" ref={imageInputRef} accept="image/*" multiple onChange={handleImagesSelect} className="hidden" />
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img src={url} alt={`img-${index}`} className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/70 text-white px-1 rounded">{index + 1}</span>
            </div>
          ))}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-30"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">Las imágenes se asignan a los pasos en orden</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
          Cancelar
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generar con IA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}