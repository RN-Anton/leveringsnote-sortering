import { useEffect } from "react";
import { Trash2, RefreshCw, Play } from "lucide-react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { ProcessingProgress } from "@/components/ProcessingProgress";
import { DeliveryNoteCard } from "@/components/DeliveryNoteCard";
import { Button } from "@/components/ui/button";
import { useBatchProcessing } from "@/hooks/useBatchProcessing";

const Index = () => {
  const {
    files,
    deliveryNotes,
    progress,
    isProcessing,
    addFiles,
    clearFiles,
    startProcessing,
    refreshNotes,
    deleteNote,
    updateNote,
  } = useBatchProcessing();

  // Load existing notes on mount
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const isReady = files.length > 0 && !isProcessing;
  const showProgress = progress.status !== "idle";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Upload Section */}
        <section className="mb-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              Upload PDF-dokumenter
            </h1>
            <p className="text-muted-foreground">
              Træk PDF-filer hertil, eller vælg en mappe med filer
            </p>
          </div>

          <UploadZone
            onFilesSelect={addFiles}
            isProcessing={isProcessing}
            selectedCount={files.length}
          />

          {/* Action buttons */}
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in">
              <Button
                onClick={startProcessing}
                disabled={!isReady}
                className="gap-2"
                size="lg"
              >
                <Play className="h-4 w-4" />
                Læs {files.length} {files.length === 1 ? "fil" : "filer"}
              </Button>

              <Button
                variant="outline"
                onClick={clearFiles}
                disabled={isProcessing}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Ryd valgte
              </Button>

              <span className="text-sm text-muted-foreground">
                Klik "Læs" for at analysere PDF-filerne med AI
              </span>
            </div>
          )}
        </section>

        {/* Processing Progress */}
        {showProgress && (
          <section className="mb-8">
            <ProcessingProgress progress={progress} />
          </section>
        )}

        {/* Delivery Notes Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Følgesedler ({deliveryNotes.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotes}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Opdater
            </Button>
          </div>

          {deliveryNotes.length > 0 ? (
            <div className="space-y-4">
              {deliveryNotes.map((note) => (
                <DeliveryNoteCard
                  key={note.id}
                  note={note}
                  onUndo={deleteNote}
                  onUpdate={updateNote}
                  showUndo
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
              <p className="text-muted-foreground">
                {isProcessing
                  ? "Analyserer filer..."
                  : "Ingen følgesedler endnu. Upload PDF-filer og klik 'Læs' for at starte."}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
