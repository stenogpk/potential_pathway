import 'package:flutter/material.dart';

class AdaptivePlan {
  final int availableMinutes, requiredMinutes, remainingDays, remainingTopics, completedTopics, totalTopics, todayMinutes, carryMinutes;
  final bool onTrack; final List<AdaptiveBlock> blocks; final String message;
  const AdaptivePlan({required this.availableMinutes,required this.requiredMinutes,required this.remainingDays,required this.remainingTopics,required this.completedTopics,required this.totalTopics,required this.todayMinutes,required this.carryMinutes,required this.onTrack,required this.blocks,required this.message});
}
class AdaptiveBlock { final String type,title; final int minutes; final IconData icon; const AdaptiveBlock(this.type,this.title,this.minutes,this.icon); }

class AdaptiveEngine {
  static AdaptivePlan build({required Map<String,dynamic> state,required String missionId,required int availableMinutes,required DateTime? examDate}) {
    final now=DateTime.now();
    final nodes=(state['nodes'] as List? ?? const []).whereType<Map>().map((e)=>Map<String,dynamic>.from(e)).where((n)=>n['missionId']==missionId&&n['kind']=='topic').toList();
    final total=nodes.length, completed=nodes.where((n)=>n['status']=='completed').length, remaining=(total-completed).clamp(0,total);
    final days=examDate==null?0:daysBetween(now,examDate);
    final sessions=(state['sessions'] as List? ?? const []).whereType<Map>().where((s)=>s['missionId']==missionId).toList();
    final attempts=(state['attempts'] as List? ?? const []).whereType<Map>().where((a)=>a['missionId']==missionId).toList();
    final todayMinutes=sessions.where((s){final d=DateTime.tryParse((s['startedAt']??'').toString());return d!=null&&d.year==now.year&&d.month==now.month&&d.day==now.day;}).fold<int>(0,(a,s)=>a+(((s['seconds'] as num?)?.round()??0)/60).ceil());
    final pastMinutes=sessions.fold<int>(0,(a,s)=>a+(((s['seconds'] as num?)?.round()??0)/60).ceil());
    final carry=remaining==0||days==0?0:((remaining*10).ceil()-pastMinutes).clamp(0,120);
    final baseRequired=remaining==0?0:(days>0?((remaining*10/days).ceil():10);
    final required=baseRequired<5?5:baseRequired+(carry>0?(carry/(days<1?1:days)).ceil():0);
    final due=(state['revisions'] as List? ?? const []).whereType<Map>().where((r){if(r['missionId']!=missionId)return false;final d=DateTime.tryParse((r['dueAt']??'').toString());return d!=null&&!d.isAfter(now);}).length;
    final accuracy=attempts.isEmpty?null:attempts.where((a)=>a['isCorrect']==true).length/attempts.length;
    final blocks=<AdaptiveBlock>[]; var left=availableMinutes;
    if(due>0&&left>0){final m=left>=10?10:left;blocks.add(AdaptiveBlock('revision','Due revision',m,Icons.refresh));left-=m;}
    if(left>0&&accuracy!=null&&accuracy<0.65){final m=left>=10?10:left;blocks.add(AdaptiveBlock('weak','Weak-topic re-test',m,Icons.warning_amber));left-=m;}
    if(left>0&&remaining>0){final m=left>=15?15:left;blocks.add(AdaptiveBlock('learn','New course material',m,Icons.menu_book));left-=m;}
    if(left>0){blocks.add(AdaptiveBlock('practice','Adaptive MCQ practice',left,Icons.quiz));}
    if(blocks.isEmpty&&availableMinutes>0)blocks.add(AdaptiveBlock('review','Consolidation review',availableMinutes,Icons.auto_awesome));
    final onTrack=examDate==null?true:availableMinutes>=required;
    final message=examDate==null?'Today plan is based on your available time, growth and revision history. Set an exam date to calculate the deadline-driven requirement.':(onTrack?'On pace: today\'s time covers the current required load of about '+required.toString()+' min.':'Behind pace: the system needs about '+required.toString()+' min today to stay aligned with the exam date.');
    return AdaptivePlan(availableMinutes:availableMinutes,requiredMinutes:required,remainingDays:days,remainingTopics:remaining,completedTopics:completed,totalTopics:total,todayMinutes:todayMinutes,carryMinutes:carry,onTrack:onTrack,blocks:blocks,message:message);
  }
  static int daysBetween(DateTime a,DateTime b){final d=DateTime(b.year,b.month,b.day).difference(DateTime(a.year,a.month,a.day)).inDays;return d<0?0:d;}
}