import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'syllabus_data.dart';

Map<String, dynamic> initialState() => {
  'version': 2,
  'nodes': SyllabusData.initialNodes(),
  'sessions': <Map<String, dynamic>>[],
  'sources': <Map<String, dynamic>>[],
  'chunks': <Map<String, dynamic>>[],
  'courses': <Map<String, dynamic>>[],
  'attempts': <Map<String, dynamic>>[],
  'revisions': <Map<String, dynamic>>[],
  'verificationRequests': <Map<String, dynamic>>[],
  'aiApiKey': '',
  'aiModel': 'gemini-2.5-flash',
  'activeMission': 'pcs',
  'questions': <Map<String, dynamic>>[
    {
      'id': 'pp-demo-1',
      'missionId': 'pcs',
      'subjectId': 'product',
      'topicId': 'readiness',
      'questionType': 'concept',
      'sourceRefs': <String>[],
      'sourceChunkRefs': <String>[],
      'stem': 'Which cycle is the Potential Pathway readiness loop built around?',
      'options': [
        {'id': 'a', 'text': 'Learn → Practice → Revise → Analyse → Retain'},
        {'id': 'b', 'text': 'Read → Memorise → Stop'},
        {'id': 'c', 'text': 'Only MCQs'},
        {'id': 'd', 'text': 'Only video lectures'},
      ],
      'correctOptionId': 'a',
      'explanation': 'This is the product preparation loop.',
      'difficulty': 'easy',
      'tags': ['product-demo'],
    },
    {
      'id': 'pp-demo-2',
      'missionId': 'pcs',
      'subjectId': 'product',
      'topicId': 'sources',
      'questionType': 'concept',
      'sourceRefs': <String>[],
      'sourceChunkRefs': <String>[],
      'stem': 'Where should detailed mission content come from?',
      'options': [
        {'id': 'a', 'text': 'Random web summaries'},
        {'id': 'b', 'text': 'Source-grounded official/reference material'},
        {'id': 'c', 'text': 'Unverified notes only'},
        {'id': 'd', 'text': 'Generated content without sources'},
      ],
      'correctOptionId': 'b',
      'explanation': 'PP uses a source-first evidence policy.',
      'difficulty': 'easy',
      'tags': ['product-demo'],
    },
  ],
};

class StudyStore extends ChangeNotifier {
  static const _key = 'potential-pathway-flutter-state-v1';

  late final SharedPreferencesAsync _prefs;

  Map<String, dynamic> state = initialState();
  bool ready = false;

  Future<void> init() async {
    _prefs = SharedPreferencesAsync();
    try {
      final raw = await _prefs.getString(_key);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          state = _normalize(Map<String, dynamic>.from(decoded));
        }
      }
    } catch (_) {
      state = initialState();
    }
    ready = true;
    notifyListeners();
  }

  Future<void> save() async {
    await _prefs.setString(_key, jsonEncode(state));
  }

  Future<void> replaceState(Map<String, dynamic> next) async {
    state = _normalize(next);
    await save();
    notifyListeners();
  }

  Future<void> reset() async {
    state = initialState();
    await save();
    notifyListeners();
  }

  List<Map<String, dynamic>> list(String key) {
    final raw = state[key];
    if (raw is! List) return [];
    return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  void putList(String key, List<Map<String, dynamic>> rows) {
    state[key] = rows;
    notifyListeners();
    save();
  }

  Map<String, dynamic> _normalize(Map<String, dynamic> value) {
    final merged = initialState();
    merged.addAll(value);
    for (final key in [
      'sessions',
      'sources',
      'chunks',
      'courses',
      'nodes',
      'attempts',
      'revisions',
      'verificationRequests',
      'questions',
    ]) {
      final raw = merged[key];
      merged[key] = raw is List
          ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : <Map<String, dynamic>>[];
    }
    merged['version'] = 2;
    if ((merged['nodes'] as List).isEmpty) merged['nodes'] = SyllabusData.initialNodes();
    return merged;
  }
}
