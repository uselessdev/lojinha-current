"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Trash2Icon } from "lucide-react";

type Props = {
  name?: string;
  multiple?: boolean;
  files?: File[];
  onRemoveFile?: (file: File) => void;
  onChange: (event: {
    target: { name: string; files: File[]; value: File[] };
  }) => void;
};

export function InputUpload({
  multiple,
  name = "upload",
  files = [],
  onChange,
  onRemoveFile,
}: Props) {
  const onDrop = useCallback((files: File[]) => {
    files.forEach((file: File) => {
      const values = [file];

      onChange({
        target: {
          name,
          files: values,
          value: values,
        },
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept: {
      "image/jpg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxSize: 2 / 1e-6, // <- maxSize to 2mb,
    onDrop,
  });

  return (
    <section
      className={clsx("w-full rounded-md bg-gray-50 p-2", {
        "ring-2 ring-gray-700 ring-offset-2": isDragActive,
      })}
    >
      <div {...getRootProps({ className: "dropzone min-h-[160px]" })}>
        <input {...getInputProps()} />

        {files.length <= 0 ? (
          <div className="grid min-h-[160px] place-content-center">
            <p className="h-full w-full text-center text-sm text-gray-400">
              Selecione ou arraste seus arquivos aqui.
            </p>
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
            {files.map((file: File) => (
              <picture key={file.name} className="relative">
                {/* eslint-disable-next-line */}
                <img
                  src={URL.createObjectURL(file)}
                  className="h-40 w-full rounded-sm object-cover object-center"
                />

                <Button
                  size="icon"
                  className="absolute bottom-2 right-2"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();

                    if (onRemoveFile) {
                      onRemoveFile(file);
                    }
                  }}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </picture>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
