import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';

class ExtractedSource {
  final String name;
  final String extension;
  final int bytes;
  final int pages;
  final String text;
  final List<String> chunks;

  ExtractedSource({
    required this.name,
    required this.extension,
    required this.bytes,
    required this.pages,
    required this.text,
    required this.chunks,
  });
}

class SourceService {
  static Future<ExtractedSource?> pickAndExtract() async {
    final file = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'txt', 'md'],
    );
    if (file == null) return null;

    final bytes = await file.readAsBytes();
    final extension = (file.extension ?? '').toLowerCase();

    if (extension == 'pdf') {
      return _extractPdf(file.name, bytes);
    }

    final text = utf8.decode(bytes, allowMalformed: true).trim();
    if (text.isEmpty) {
      throw Exception('The selected text file is empty.');
    }

    return ExtractedSource(
      name: file.name,
      extension: extension,
      bytes: bytes.length,
      pages: 1,
      text: text,
      chunks: _chunk(text),
    );
  }

  static ExtractedSource _extractPdf(String name, Uint8List bytes) {
    final document = PdfDocument(inputBytes: bytes);
    try {
      final pages = document.pages.count;
      final text = PdfTextExtractor(document).extractText().trim();
      if (text.isEmpty) {
        throw Exception(
          'PDF text extraction returned no text. Scanned/image-only PDFs need OCR.',
        );
      }
      return ExtractedSource(
        name: name,
        extension: 'pdf',
        bytes: bytes.length,
        pages: pages,
        text: text,
        chunks: _chunk(text),
      );
    } finally {
      document.dispose();
    }
  }

  static List<String> _chunk(String input, {int maxLength = 1400}) {
    final clean = input.replaceAll(RegExp(r'\s+'), ' ').trim();
    final result = <String>[];
    var start = 0;

    while (start < clean.length) {
      var end = (start + maxLength).clamp(0, clean.length);
      if (end < clean.length) {
        final cut = clean.lastIndexOf(RegExp(r'[.!?;]\s'), end);
        if (cut > start + 400) {
          end = cut + 1;
        } else {
          final space = clean.lastIndexOf(' ', end);
          if (space > start + 400) end = space;
        }
      }
      final piece = clean.substring(start, end).trim();
      if (piece.isNotEmpty) result.add(piece);
      start = end;
      while (start < clean.length && clean[start] == ' ') {
        start++;
      }
    }
    return result;
  }
}
