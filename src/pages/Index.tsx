import { Undo2 } from "lucide-react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { PageGrid } from "@/components/PageGrid";
import { CreateNoteForm } from "@/components/CreateNoteForm";
import { DeliveryNoteCard } from "@/components/DeliveryNoteCard";
import { Button } from "@/components/ui/button";
import { useDeliveryNotes } from "@/hooks/useDeliveryNotes";

const Index = () => {
  const {
    document,
    deliveryNotes,
    selectedPages,
    allocatedPages,
    isProcessing,
    lastCreatedNoteId,
    handleFileUpload,
    togglePageSelection,
    clearSelection,
    createDeliveryNote,
    undoLastNote,
  } = useDeliveryNotes();

  const handleSubmit = (data: { displayName: string; companyName: string }) => {
    createDeliveryNote(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Upload Section */}
        <section className="mb-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              Upload PDF-dokument
            </h1>
            <p className="text-muted-foreground">
              Træk en PDF-fil hertil eller klik for at vælge
            </p>
          </div>
          <UploadZone onFileSelect={handleFileUpload} isProcessing={isProcessing} />
        </section>

        {/* Document loaded - show grid and form */}
        {document && (
          <>
            {/* Page Selection Section */}
            <section className="mb-8 animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Vælg sider fra dokumentet
                  </h2>
                  <p className="text-muted-foreground">
                    {document.originalFilename} • {document.pageCount} sider
                  </p>
                </div>

                {/* Global undo button */}
                {lastCreatedNoteId && (
                  <Button
                    variant="outline"
                    onClick={undoLastNote}
                    className="gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    Fortryd seneste
                  </Button>
                )}
              </div>

              <PageGrid
                totalPages={document.pageCount}
                selectedPages={selectedPages}
                allocatedPages={allocatedPages}
                onPageClick={togglePageSelection}
              />
            </section>

            {/* Create Form Section */}
            <section className="mb-8 animate-fade-in">
              <CreateNoteForm
                selectedCount={selectedPages.size}
                onSubmit={handleSubmit}
                onClearSelection={clearSelection}
                isSubmitting={false}
              />
            </section>

            {/* Created Notes Section */}
            {deliveryNotes.length > 0 && (
              <section className="animate-fade-in">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Oprettede følgesedler
                </h2>
                <div className="space-y-4">
                  {deliveryNotes.map((note) => (
                    <DeliveryNoteCard
                      key={note.id}
                      note={note}
                      showUndo={note.id === lastCreatedNoteId}
                      onUndo={undoLastNote}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty state when no document */}
        {!document && !isProcessing && (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-lg">
              Upload en PDF-fil for at begynde at oprette følgesedler
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
