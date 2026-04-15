'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfDocumentViewerProps {
    pdfData: string;
    pageIndex: number;
    highlights: any[];
    selectedCpt: string | null;
    getRawColor: (cpt: string) => string;
    onHighlightClick: (cpt: string) => void;
    sourceDocType: string;
    colorMap: Record<string, { bg: string; border: string }>;
}

export default function PdfDocumentViewer({
    pdfData,
    pageIndex,
    highlights,
    selectedCpt,
    getRawColor,
    onHighlightClick,
    sourceDocType,
    colorMap,
}: PdfDocumentViewerProps) {
    if (!pdfData) return <div className="p-8 text-gray-400 italic">No PDF document loaded.</div>;

    return (
        <div className="relative w-full flex justify-center bg-transparent overflow-hidden">
            <Document file={pdfData} className="flex justify-center flex-col items-center">
                <Page
                    pageNumber={pageIndex + 1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={550}
                    className="relative"
                >
                    {highlights.map((item: any, idx: number) => {
                        let boxes: any[] = [];
                        if (item.bounding_boxes && Array.isArray(item.bounding_boxes)) {
                            if (item.source_doc && item.source_doc !== 'both' && item.source_doc !== sourceDocType) return null;
                            boxes = item.bounding_boxes;
                        } else if (item.bounding_boxes) {
                            boxes = item.bounding_boxes[sourceDocType] || [];
                        }

                        if (!boxes || boxes.length === 0) return null;
                        const isSelected = selectedCpt === item.cpt_code;
                        const rawColor = getRawColor(item.cpt_code);
                        const colors = colorMap[rawColor] || colorMap.slate;

                        return boxes
                            .filter((box: any) => box.page_index === pageIndex)
                            .map((box: any, boxIdx: number) => {
                                const left = (box.x0 / box.width) * 100;
                                const top = (box.y0 / box.height) * 100;
                                const width = ((box.x1 - box.x0) / box.width) * 100;
                                const height = ((box.y1 - box.y0) / box.height) * 100;

                                return (
                                    <div
                                        key={`${idx}-${boxIdx}`}
                                        onClick={(e) => { e.stopPropagation(); onHighlightClick(item.cpt_code); }}
                                        className={cn('absolute cursor-pointer transition-all duration-200', isSelected ? 'z-10' : 'z-0')}
                                        title={item.cpt_code}
                                        style={{
                                            left: `${left}%`,
                                            top: `${top}%`,
                                            width: `${width}%`,
                                            height: `${height}%`,
                                            borderRadius: '3px',
                                            backgroundColor: isSelected
                                                ? colors.bg.replace(/[\d.]+\)$/, '0.45)')
                                                : colors.bg,
                                            borderWidth: isSelected ? '2px' : '1.5px',
                                            borderStyle: 'solid',
                                            borderColor: colors.border,
                                            ...(isSelected ? {
                                                boxShadow: `0 0 0 3px ${colors.border.replace(/[\d.]+\)$/, '0.30)')}`,
                                            } : {}),
                                        }}
                                    />
                                );
                            });
                    })}
                </Page>
            </Document>
        </div>
    );
}
