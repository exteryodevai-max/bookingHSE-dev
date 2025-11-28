import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../components/ui/FileUpload';
import { useFileUpload } from '../hooks/useFileUpload';
import { validateFile } from '../lib/storage/utils/validation';
import { optimizeImage } from '../lib/storage/utils/optimization';
import { ValidationPresets } from '../lib/storage/utils/validation';
import { OptimizationPresets } from '../lib/storage/utils/optimization';

// Mock delle dipendenze
vi.mock('../hooks/useFileUpload');
vi.mock('../lib/storage/utils/validation');
vi.mock('../lib/storage/utils/optimization');

// Mock di file di test
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload Component', () => {
  const mockUploadFile = vi.fn();
  const mockReset = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: false,
        progress: 0,
        error: null,
        results: [],
        aborted: false
      }
    });
  });

  it('should render file upload component', () => {
    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    expect(screen.getByText(/trascina i file qui/i)).toBeInTheDocument();
    expect(screen.getByText(/sfoglia file/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const testFile = createMockFile('test.jpg', 1024, 'image/jpeg');
    const onFilesSelected = vi.fn();

    render(
      <FileUpload
        onFilesSelected={onFilesSelected}
        onError={vi.fn()}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalled();
    });
  });

  it('should show upload progress', () => {
    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: true,
        progress: 50,
        error: null,
        results: [],
        aborted: false
      }
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should handle upload errors', () => {
    const errorMessage = 'Upload failed';
    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: false,
        progress: 0,
        error: errorMessage,
        results: [],
        aborted: false
      }
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should validate files before upload', async () => {
    const testFile = createMockFile('test.txt', 1024, 'text/plain');
    const onError = vi.fn();
    
    (validateFile as ReturnType<typeof vi.fn>).mockReturnValue({
      isValid: false,
      errors: ['Invalid file type']
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={onError}
        validation={ValidationPresets.IMAGE}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(['Invalid file type']);
    });
  });

  it('should optimize images before upload', async () => {
    const testFile = createMockFile('test.jpg', 1024, 'image/jpeg');
    const optimizedFile = createMockFile('optimized.jpg', 512, 'image/jpeg');
    
    (validateFile as ReturnType<typeof vi.fn>).mockReturnValue({
      isValid: true,
      errors: []
    });
    
    (optimizeImage as ReturnType<typeof vi.fn>).mockResolvedValue(optimizedFile);

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
        optimization={OptimizationPresets.WEB}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(optimizeImage).toHaveBeenCalledWith(testFile, OptimizationPresets.WEB);
    });
  });

  it('should handle multiple file selection', async () => {
    const files = [
      createMockFile('test1.jpg', 1024, 'image/jpeg'),
      createMockFile('test2.jpg', 2048, 'image/jpeg')
    ];
    const onFilesSelected = vi.fn();

    render(
      <FileUpload
        onFilesSelected={onFilesSelected}
        onError={vi.fn()}
        multiple
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files }
    });

    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledWith(files);
    });
  });

  it('should respect file size limits', async () => {
    const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
    const onError = vi.fn();
    
    (validateFile as ReturnType<typeof vi.fn>).mockReturnValue({
      isValid: false,
      errors: ['File too large']
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={onError}
        validation={{
          ...ValidationPresets.IMAGE,
          maxSize: 5 * 1024 * 1024 // 5MB limit
        }}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, {
      target: { files: [largeFile] }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(['File too large']);
    });
  });

  it('should handle drag and drop', async () => {
    const testFile = createMockFile('test.jpg', 1024, 'image/jpeg');
    const onFilesSelected = vi.fn();

    render(
      <FileUpload
        onFilesSelected={onFilesSelected}
        onError={vi.fn()}
      />
    );

    const dropZone = screen.getByText(/trascina i file qui/i).closest('div');
    
    fireEvent.dragOver(dropZone!);
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [testFile]
      }
    });

    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalled();
    });
  });

  it('should show upload results', () => {
    const results = [
      { file: createMockFile('test1.jpg', 1024, 'image/jpeg'), url: 'https://example.com/test1.jpg' },
      { file: createMockFile('test2.jpg', 2048, 'image/jpeg'), url: 'https://example.com/test2.jpg' }
    ];

    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: false,
        progress: 100,
        error: null,
        results,
        aborted: false
      }
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    expect(screen.getByText('test2.jpg')).toBeInTheDocument();
  });

  it('should allow canceling uploads', () => {
    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: true,
        progress: 30,
        error: null,
        results: [],
        aborted: false
      }
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    const cancelButton = screen.getByText(/annulla/i);
    fireEvent.click(cancelButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it('should reset upload state', () => {
    const results = [
      { file: createMockFile('test.jpg', 1024, 'image/jpeg'), url: 'https://example.com/test.jpg' }
    ];

    (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue({
      uploadFile: mockUploadFile,
      reset: mockReset,
      state: {
        uploading: false,
        progress: 100,
        error: null,
        results,
        aborted: false
      }
    });

    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        onError={vi.fn()}
      />
    );

    const resetButton = screen.getByText(/reset/i);
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalled();
  });
});