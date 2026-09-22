import 'dart:convert';
import 'package:http/http.dart' as http;

class AiResult {
  final String text; final String model;
  AiResult(this.text,this.model);
}

class AiService {
  static const model='gemini-2.5-flash';
  static const endpoint='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  static Future<AiResult> generate({required String apiKey,required String system,required String prompt}) async {
    final key=apiKey.trim();
    if(key.isEmpty) throw Exception('Gemini API key is not configured.');
    final res=await http.post(Uri.parse(endpoint),headers:{'Content-Type':'application/json','x-goog-api-key':key},body:jsonEncode({
      'systemInstruction':{'parts':[{'text':system}]},
      'contents':[{'role':'user','parts':[{'text':prompt}]}],
      'generationConfig':{'temperature':0.2,'maxOutputTokens':1800},
    })).timeout(const Duration(seconds:45));
    if(res.statusCode<200||res.statusCode>=300) throw Exception('AI request failed (${res.statusCode}).');
    final data=jsonDecode(res.body);
    final candidates=data['candidates'] as List?;
    final parts=(candidates!=null&&candidates.isNotEmpty)?(candidates[0]['content']['parts'] as List? ?? const[]):const[];
    final text=parts.map((p)=>p['text']?.toString()??'').join().trim();
    if(text.isEmpty) throw Exception('AI returned no text.');
    return AiResult(text,model);
  }
}