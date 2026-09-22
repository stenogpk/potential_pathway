import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import 'services/source_service.dart';
import 'study_store.dart';

const missions = <Map<String, Object>>[
  {'id':'pcs','title':'PCS / GS','subtitle':'Primary Mission','active':true,'minutes':50},
  {'id':'chemistry','title':'PGT Chemistry','subtitle':'Secondary Mission','active':true,'minutes':30,'examDate':'2026-12-15','questions':120,'duration':120,'marks':400,'written':360,'interview':40,'marking':'+3 / -1'},
  {'id':'roaro','title':'RO / ARO','subtitle':'Coming Soon','active':false,'minutes':50},
];

Map<String,Object> mission(String id) => missions.firstWhere((m)=>m['id']==id, orElse:()=>missions.first);

String newId(String prefix) => prefix + '-' + DateTime.now().microsecondsSinceEpoch.toString();

List<Map<String,dynamic>> listRows(Map<String,dynamic> state, String key) =>
  (state[key] as List? ?? const []).whereType<Map>().map((e)=>Map<String,dynamic>.from(e)).toList();

class PotentialPathwayApp extends StatelessWidget {
  final StudyStore store;
  final bool autoInit;
  const PotentialPathwayApp({super.key, required this.store, this.autoInit=true});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title:'Potential Pathway',
    debugShowCheckedModeBanner:false,
    theme:ThemeData(
      useMaterial3:true,
      colorScheme:ColorScheme.fromSeed(seedColor:const Color(0xFF6D5EF7),brightness:Brightness.dark),
      scaffoldBackgroundColor:const Color(0xFF0B1020),
    ),
    home:autoInit
      ? FutureBuilder<void>(
          future:store.init(),
          builder:(context,snapshot)=>snapshot.connectionState==ConnectionState.done
            ? HomeShell(store:store)
            : const StartupPage(),
        )
      : HomeShell(store:store),
  );
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(PotentialPathwayApp(store:StudyStore()));
}

class StartupPage extends StatelessWidget {
  const StartupPage({super.key});
  @override
  Widget build(BuildContext context)=>const Scaffold(
    body:Center(child:Column(mainAxisSize:MainAxisSize.min,children:[
      CircleAvatar(radius:38,child:Text('PP',style:TextStyle(fontSize:26,fontWeight:FontWeight.w900))),
      SizedBox(height:16),
      Text('Potential Pathway',style:TextStyle(fontSize:25,fontWeight:FontWeight.w800)),
      SizedBox(height:6),
      Text('Native Flutter Android build'),
    ])),
  );
}

class HomeShell extends StatefulWidget {
  final StudyStore store;
  const HomeShell({super.key,required this.store});
  @override
  State<HomeShell> createState()=>_HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int tab=0;
  String currentMission='pcs';

  void setMission(String id){
    if(mission(id)['active']!=true) return;
    setState(()=>currentMission=id);
    widget.store.state['activeMission']=id;
    widget.store.save();
  }

  Future<void> open(Widget page) async {
    Navigator.pop(context);
    await Navigator.push(context,MaterialPageRoute(builder:(_)=>page));
    if(mounted) setState((){});
  }

  @override
  Widget build(BuildContext context)=>AnimatedBuilder(
    animation:widget.store,
    builder:(context,_){
      final pages=[
        Dashboard(store:widget.store,missionId:currentMission,onMission:setMission),
        Sources(store:widget.store,missionId:currentMission),
        Practice(store:widget.store,missionId:currentMission),
        Course(store:widget.store,missionId:currentMission),
        Readiness(store:widget.store,missionId:currentMission),
      ];
      return Scaffold(
        appBar:AppBar(
          title:const Text('Potential Pathway',style:TextStyle(fontWeight:FontWeight.w800)),
          actions:[Padding(padding:const EdgeInsets.only(right:14),child:Center(child:Text(mission(currentMission)['title'].toString(),style:TextStyle(color:Theme.of(context).colorScheme.primary,fontWeight:FontWeight.w700))))],
        ),
        drawer:Drawer(
          child:SafeArea(child:ListView(
            padding:const EdgeInsets.all(12),
            children:[
              const Padding(padding:EdgeInsets.all(12),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
                CircleAvatar(radius:28,child:Text('PP',style:TextStyle(fontWeight:FontWeight.w900))),
                SizedBox(height:12),
                Text('Potential Pathway',style:TextStyle(fontSize:21,fontWeight:FontWeight.w800)),
                SizedBox(height:4),
                Text('Exam Preparation System'),
              ])),
              const Divider(),
              const Padding(padding:EdgeInsets.fromLTRB(12,10,12,4),child:Text('MISSIONS',style:TextStyle(fontSize:11,fontWeight:FontWeight.w800))),
              for(final m in missions)
                ListTile(
                  leading:Icon(m['active']==true?Icons.track_changes:Icons.lock_outline),
                  title:Text(m['title'].toString()),
                  subtitle:Text(m['subtitle'].toString()),
                  selected:currentMission==m['id'],
                  onTap:m['active']==true?(){Navigator.pop(context);setMission(m['id'].toString());}:null,
                ),
              const Divider(),
              ListTile(leading:const Icon(Icons.chat_outlined),title:const Text('AI Study Chat'),onTap:()=>open(Chat(store:widget.store,missionId:currentMission))),
              ListTile(leading:const Icon(Icons.library_add_outlined),title:const Text('Question Studio'),onTap:()=>open(QuestionStudio(store:widget.store,missionId:currentMission))),
              ListTile(leading:const Icon(Icons.fact_check_outlined),title:const Text('External Verification'),onTap:()=>open(ExternalVerification(store:widget.store,missionId:currentMission))),
              ListTile(leading:const Icon(Icons.timer_outlined),title:const Text('Mock Test'),onTap:()=>open(Mock(store:widget.store,missionId:currentMission))),
              ListTile(leading:const Icon(Icons.backup_outlined),title:const Text('Backup & Restore'),onTap:()=>open(Backup(store:widget.store))),
              ListTile(
                leading:const Icon(Icons.restart_alt),
                title:const Text('Reset local data'),
                onTap:() async {
                  Navigator.pop(context);
                  final yes=await showDialog<bool>(context:context,builder:(_)=>AlertDialog(
                    title:const Text('Reset local data?'),
                    content:const Text('This removes local study state on this device.'),
                    actions:[
                      TextButton(onPressed:()=>Navigator.pop(context,false),child:const Text('Cancel')),
                      FilledButton(onPressed:()=>Navigator.pop(context,true),child:const Text('Reset')),
                    ],
                  ));
                  if(yes==true) await widget.store.reset();
                },
              ),
              const Padding(padding:EdgeInsets.all(12),child:Text('Developed by Shartendu',style:TextStyle(fontSize:12))),
            ],
          )),
        ),
        body:IndexedStack(index:tab,children:pages),
        bottomNavigationBar:NavigationBar(
          selectedIndex:tab,
          onDestinationSelected:(v)=>setState(()=>tab=v),
          destinations:const[
            NavigationDestination(icon:Icon(Icons.dashboard_outlined),selectedIcon:Icon(Icons.dashboard),label:'Dashboard'),
            NavigationDestination(icon:Icon(Icons.description_outlined),selectedIcon:Icon(Icons.description),label:'Sources'),
            NavigationDestination(icon:Icon(Icons.quiz_outlined),selectedIcon:Icon(Icons.quiz),label:'Practice'),
            NavigationDestination(icon:Icon(Icons.account_tree_outlined),selectedIcon:Icon(Icons.account_tree),label:'Course'),
            NavigationDestination(icon:Icon(Icons.insights_outlined),selectedIcon:Icon(Icons.insights),label:'Readiness'),
          ],
        ),
      );
    },
  );
}

class Dashboard extends StatelessWidget {
  final StudyStore store; final String missionId; final void Function(String) onMission;
  const Dashboard({super.key,required this.store,required this.missionId,required this.onMission});
  @override
  Widget build(BuildContext context){
    final sessions=listRows(store.state,'sessions').where((x)=>x['missionId']==missionId).toList();
    final attempts=listRows(store.state,'attempts').where((x)=>x['missionId']==missionId).toList();
    final revisions=listRows(store.state,'revisions').where((x)=>x['missionId']==missionId).toList();
    final sources=listRows(store.state,'sources').where((x)=>x['missionId']==missionId).length;
    final chunks=listRows(store.state,'chunks').where((x)=>x['missionId']==missionId).length;
    final correct=attempts.where((x)=>x['isCorrect']==true).length;
    final accuracy=attempts.isEmpty?null:(correct*100/attempts.length).round();
    final due=revisions.where((r){final d=DateTime.tryParse((r['dueAt']??'').toString());return d!=null&&!d.isAfter(DateTime.now());}).length;
    final today=DateTime.now();
    final mins=sessions.where((s){final d=DateTime.tryParse((s['startedAt']??'').toString());return d!=null&&d.year==today.year&&d.month==today.month&&d.day==today.day;}).fold<int>(0,(a,b)=>a+((b['seconds'] as num?)?.round()??0))~/60;
    return ListView(
      padding:const EdgeInsets.all(18),
      children:[
        Card(child:Padding(padding:const EdgeInsets.all(20),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
          const Chip(label:Text("TODAY'S PATHWAY")),
          const SizedBox(height:6),
          const Text('Build readiness, not just hours.',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),
          const SizedBox(height:6),
          const Text('Learn → Practice → Revise → Analyse → Retain.'),
          const SizedBox(height:14),
          Wrap(spacing:8,children:[60,50,30,10].map((m)=>OutlinedButton.icon(onPressed:()=>startSession(context,store,missionId,m),icon:const Icon(Icons.play_arrow,size:16),label:Text(m.toString()+' min'))).toList()),
        ]))),
        const SizedBox(height:12),
        Row(children:[
          Expanded(child:Metric(label:'Study today',value:mins.toString()+' min',icon:Icons.schedule)),
          const SizedBox(width:8),
          Expanded(child:Metric(label:'Accuracy',value:accuracy==null?'—':accuracy.toString()+'%',icon:Icons.quiz)),
          const SizedBox(width:8),
          Expanded(child:Metric(label:'Due revision',value:due.toString(),icon:Icons.refresh)),
        ]),
        const SizedBox(height:18),
        const Text('Preparation pathways',style:TextStyle(fontSize:20,fontWeight:FontWeight.w800)),
        const SizedBox(height:8),
        for(final m in missions) Padding(
          padding:const EdgeInsets.only(bottom:9),
          child:Card(child:ListTile(
            leading:CircleAvatar(child:Icon(m['active']==true?Icons.track_changes:Icons.lock_outline)),
            title:Text(m['title'].toString(),style:const TextStyle(fontWeight:FontWeight.w800)),
            subtitle:Text(m['active']==true?'Active • '+m['subtitle'].toString():'Coming Soon'),
            trailing:Text(m['id']=='roaro'?'—':(m['id']==missionId?'Selected':'Select')),
            onTap:m['active']==true?()=>onMission(m['id'].toString()):null,
          )),
        ),
        Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
          Text('NEXT STUDY BLOCK • '+mission(missionId)['title'].toString(),style:TextStyle(fontSize:11,color:Theme.of(context).colorScheme.primary,fontWeight:FontWeight.w800)),
          const SizedBox(height:8),
          const Text('Adaptive plan',style:TextStyle(fontSize:18,fontWeight:FontWeight.w800)),
          const SizedBox(height:4),
          Text(sources.toString()+' source(s) • '+chunks.toString()+' indexed evidence chunk(s)'),
          const SizedBox(height:10),
          if(due>0) const ListTile(contentPadding:EdgeInsets.zero,leading:CircleAvatar(child:Text('1')),title:Text('Due revision — 15 min')),
          if(chunks>0) const ListTile(contentPadding:EdgeInsets.zero,leading:CircleAvatar(child:Text('2')),title:Text('Source recall — 15 min')),
          const ListTile(contentPadding:EdgeInsets.zero,leading:CircleAvatar(child:Text('3')),title:Text('Adaptive MCQ practice — 15 min')),
          const ListTile(contentPadding:EdgeInsets.zero,leading:CircleAvatar(child:Text('4')),title:Text('Weak-topic re-test — 5 min')),
        ]))),
      ],
    );
  }
}

class Metric extends StatelessWidget {
  final String label,value; final IconData icon;
  const Metric({super.key,required this.label,required this.value,required this.icon});
  @override Widget build(BuildContext context)=>Card(child:Padding(padding:const EdgeInsets.all(13),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Icon(icon,size:18),const SizedBox(height:8),Text(label,style:const TextStyle(fontSize:11)),const SizedBox(height:3),Text(value,style:const TextStyle(fontSize:18,fontWeight:FontWeight.w800))])));
}

Future<void> startSession(BuildContext context,StudyStore store,String missionId,int minutes)=>showDialog(context:context,builder:(_)=>SessionDialog(store:store,missionId:missionId,minutes:minutes));

class SessionDialog extends StatefulWidget{
  final StudyStore store; final String missionId; final int minutes;
  const SessionDialog({super.key,required this.store,required this.missionId,required this.minutes});
  @override State<SessionDialog> createState()=>_SessionDialogState();
}
class _SessionDialogState extends State<SessionDialog>{
  late int remaining; Timer? timer; bool paused=false;
  @override void initState(){super.initState();remaining=widget.minutes*60;timer=Timer.periodic(const Duration(seconds:1),(_){if(paused)return;if(remaining<=1)_finish(true);else setState(()=>remaining--);});}
  void _finish(bool completed){timer?.cancel();final seconds=widget.minutes*60-remaining;if(seconds>=10){final s=listRows(widget.store.state,'sessions');s.insert(0,{'id':newId('session'),'missionId':widget.missionId,'startedAt':DateTime.now().subtract(Duration(seconds:seconds)).toIso8601String(),'seconds':seconds,'completed':completed});widget.store.putList('sessions',s.take(200).toList());}if(mounted)Navigator.pop(context);}
  @override void dispose(){timer?.cancel();super.dispose();}
  @override Widget build(BuildContext context){final m=(remaining~/60).toString().padLeft(2,'0');final s=(remaining%60).toString().padLeft(2,'0');return AlertDialog(title:const Text('Focused session'),content:Column(mainAxisSize:MainAxisSize.min,children:[Text(mission(widget.missionId)['title'].toString()),const SizedBox(height:16),Text(m+':'+s,style:const TextStyle(fontSize:44,fontWeight:FontWeight.w900)),const SizedBox(height:6),Text(paused?'Paused':'Time is recorded locally.')]),actions:[TextButton(onPressed:()=>setState(()=>paused=!paused),child:Text(paused?'Resume':'Pause')),FilledButton(onPressed:()=>_finish(false),child:const Text('Finish'))]);}
}

class Sources extends StatefulWidget{
  final StudyStore store; final String missionId;
  const Sources({super.key,required this.store,required this.missionId});
  @override State<Sources> createState()=>_SourcesState();
}
class _SourcesState extends State<Sources>{
  bool busy=false; String? error;
  Future<void> pick() async {
    setState(() { busy=true; error=null; });
    try{
      final x=await SourceService.pickAndExtract(); if(x==null)return;
      final sid=newId('source');
      final src={'id':sid,'title':x.name,'missionId':widget.missionId,'type':x.extension,'status':'indexed','authority':'user-provided','evidenceLayer':'user-source','fileBytes':x.bytes,'pageCount':x.pages,'addedAt':DateTime.now().toIso8601String()};
      final sources=listRows(widget.store.state,'sources')..insert(0,src);
      final chunks=listRows(widget.store.state,'chunks');
      for(var i=0;i<x.chunks.length;i++){chunks.add({'id':sid+':chunk-'+(i+1).toString(),'sourceId':sid,'missionId':widget.missionId,'locator':x.name+'#chunk-'+(i+1).toString(),'text':x.chunks[i],'order':i,'evidenceLayer':'user-source'});}
      widget.store.state['sources']=sources;widget.store.state['chunks']=chunks;await widget.store.save();widget.store.notifyListeners();
      if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text('Indexed '+x.chunks.length.toString()+' evidence chunk(s).')));
    }catch(e){if(mounted)setState(()=>error=e.toString());}finally{if(mounted)setState(()=>busy=false);}
  }
  @override Widget build(BuildContext context){final ss=listRows(widget.store.state,'sources').where((s)=>s['missionId']==widget.missionId).toList();return ListView(padding:const EdgeInsets.all(18),children:[
    Row(mainAxisAlignment:MainAxisAlignment.spaceBetween,children:[const Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('Source Library',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),SizedBox(height:4),Text('PDF/TXT/MD → local evidence chunks.')]),),FilledButton.icon(onPressed:busy?null:pick,icon:const Icon(Icons.upload_file),label:Text(busy?'Indexing…':'Add source'))]),
    if(error!=null) Padding(padding:const EdgeInsets.only(top:10),child:Text(error!,style:TextStyle(color:Theme.of(context).colorScheme.error))),
    const SizedBox(height:14),
    if(ss.isEmpty) const _Empty(text:'No source added for this mission.')
    else for(final s in ss) Card(child:ListTile(leading:const CircleAvatar(child:Icon(Icons.description)),title:Text(s['title'].toString()),subtitle:Text((s['type']??'').toString()+' • '+(s['pageCount']??1).toString()+' page(s) • '+listRows(widget.store.state,'chunks').where((c)=>c['sourceId']==s['id']).length.toString()+' chunk(s) • '+s['evidenceLayer'].toString()),trailing:const Icon(Icons.verified_outlined))),
  ]);}
}

class Practice extends StatefulWidget{
  final StudyStore store; final String missionId; final bool mock;
  const Practice({super.key,required this.store,required this.missionId,this.mock=false});
  @override State<Practice> createState()=>_PracticeState();
}
class _PracticeState extends State<Practice>{
  String? selected; bool submitted=false;
  List<Map<String,dynamic>> get questions=>listRows(widget.store.state,'questions').where((q)=>q['missionId']==widget.missionId).toList();
  Map<String,dynamic>? get q{final qs=questions;if(qs.isEmpty)return null;final attempts=listRows(widget.store.state,'attempts').where((a)=>a['missionId']==widget.missionId).map((a)=>a['questionId']).toSet();final fresh=qs.where((x)=>!attempts.contains(x['id'])).toList();return (fresh.isNotEmpty?fresh:qs).first;}
  void answer(){final x=q;if(x==null||selected==null||submitted)return;final ok=selected==x['correctOptionId'];final marks=widget.missionId=='chemistry'?(ok?3:-1):(ok?1:0);final a=listRows(widget.store.state,'attempts');a.insert(0,{'id':newId('attempt'),'questionId':x['id'],'missionId':widget.missionId,'topicId':x['topicId'],'selectedOptionId':selected,'isCorrect':ok,'marks':marks,'attemptedAt':DateTime.now().toIso8601String()});widget.store.state['attempts']=a;final r=listRows(widget.store.state,'revisions');final same=r.where((z)=>z['missionId']==widget.missionId&&z['topicId']==x['topicId']);if(same.isEmpty){r.insert(0,{'id':newId('revision'),'missionId':widget.missionId,'topicId':x['topicId'],'repetitions':ok?1:0,'intervalDays':1,'dueAt':DateTime.now().add(const Duration(days:1)).toIso8601String(),'lastResult':ok?'correct':'incorrect'});}else{final z=same.first;final rep=ok?((z['repetitions'] as num?)?.toInt()??0)+1:0;final iv=ok?<int>[1,3,7,14,30][math.min(rep,4)]:1;z['repetitions']=rep;z['intervalDays']=iv;z['dueAt']=DateTime.now().add(Duration(days:iv)).toIso8601String();z['lastResult']=ok?'correct':'incorrect';}widget.store.state['revisions']=r;widget.store.save();widget.store.notifyListeners();setState(()=>submitted=true);}
  void next()=>setState(() { selected=null; submitted=false; });
  @override Widget build(BuildContext context){final x=q;if(x==null)return ListView(padding:const EdgeInsets.all(18),children:const[_Empty(text:'No questions yet. Index a source, then use Question Studio.')]);final options=(x['options'] as List? ?? const[]).whereType<Map>().map((m)=>Map<String,dynamic>.from(m)).toList();final ok=selected==x['correctOptionId'];return ListView(padding:const EdgeInsets.all(18),children:[
    Row(mainAxisAlignment:MainAxisAlignment.spaceBetween,children:[const Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('Adaptive Practice',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),Text('Weak topics and new questions are prioritised.') ])),OutlinedButton(onPressed:()=>Navigator.push(context,MaterialPageRoute(builder:(_)=>QuestionStudio(store:widget.store,missionId:widget.missionId))),child:const Text('Question Studio'))]),
    const SizedBox(height:16),
    Card(child:Padding(padding:const EdgeInsets.all(20),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Wrap(spacing:8,children:[Chip(label:Text((x['questionType']??'concept').toString())),Chip(label:Text((x['difficulty']??'medium').toString())),if((x['sourceRefs'] as List?)?.isNotEmpty==true)const Chip(label:Text('Source-grounded'))]),
      const SizedBox(height:10),Text(x['stem'].toString(),style:const TextStyle(fontSize:19,fontWeight:FontWeight.w700)),const SizedBox(height:14),
      for(final o in options)Padding(padding:const EdgeInsets.only(bottom:8),child:InkWell(onTap:submitted?null:()=>setState(()=>selected=o['id'].toString()),child:Container(width:double.infinity,padding:const EdgeInsets.all(14),decoration:BoxDecoration(borderRadius:BorderRadius.circular(12),border:Border.all(color:selected==o['id']?Theme.of(context).colorScheme.primary:Colors.white12,width:selected==o['id']?2:1)),child:Text(o['id'].toString().toUpperCase()+'. '+o['text'].toString())))),
      if(submitted)Padding(padding:const EdgeInsets.only(top:8),child:Text(ok?'Correct. ':'Incorrect. Correct answer: '+x['correctOptionId'].toString()+'. '+(x['explanation']??'').toString())),
      const SizedBox(height:10),Align(alignment:Alignment.centerRight,child:submitted?FilledButton(onPressed:next,child:const Text('Next')):FilledButton(onPressed:selected==null?null:answer,child:const Text('Submit'))),
    ]))),
  ]);}
}

class Course extends StatefulWidget{final StudyStore store;final String missionId;const Course({super.key,required this.store,required this.missionId});@override State<Course> createState()=>_CourseState();}
class _CourseState extends State<Course>{
  String kind='subject';String? parent;String name='';String topic='';
  void addNode(){if(name.trim().isEmpty||(kind!='subject'&&parent==null))return;final n=listRows(widget.store.state,'nodes');n.add({'id':newId('node'),'missionId':widget.missionId,'kind':kind,'name':name.trim(),'parentId':kind=='subject'?null:parent,'status':'not-started'});widget.store.state['nodes']=n;widget.store.save();widget.store.notifyListeners();setState(() { name=''; parent=null; });}
  void buildLesson(){final t=topic.trim();if(t.isEmpty)return;final chunks=listRows(widget.store.state,'chunks').where((c)=>c['missionId']==widget.missionId).toList();final terms=t.toLowerCase().split(RegExp(r'\s+')).where((x)=>x.isNotEmpty).toList();final scored=chunks.map((c){final s=(c['text'] as String).toLowerCase();return {'c':c,'score':terms.fold<int>(0,(a,w)=>a+(s.contains(w)?1:0))};}).where((x)=>(x['score'] as int)>0).toList()..sort((a,b)=>(b['score'] as int).compareTo(a['score'] as int));if(scored.isEmpty){final q=listRows(widget.store.state,'verificationRequests');q.insert(0,{'id':newId('verify'),'missionId':widget.missionId,'topic':t,'reason':'No matching evidence in indexed source.','status':'needs-external-verification','createdAt':DateTime.now().toIso8601String()});widget.store.state['verificationRequests']=q;widget.store.save();widget.store.notifyListeners();ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('No source evidence. Verification request created.')));return;}final chosen=scored.take(6).map((x)=>Map<String,dynamic>.from(x['c'] as Map)).toList();final c=listRows(widget.store.state,'courses');c.insert(0,{'id':newId('lesson'),'missionId':widget.missionId,'title':t,'status':'draft','sourceRefs':chosen.map((x)=>x['sourceId']).toSet().toList(),'sourceChunkRefs':chosen.map((x)=>x['id']).toList(),'evidenceLayer':'user-source','body':chosen.map((x)=>'['+x['locator'].toString()+'] '+x['text'].toString()).join('\n\n'),'createdAt':DateTime.now().toIso8601String()});widget.store.state['courses']=c;widget.store.save();widget.store.notifyListeners();ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Source-backed lesson added.')));}
  @override Widget build(BuildContext context){final n=listRows(widget.store.state,'nodes').where((x)=>x['missionId']==widget.missionId).toList();final subjects=n.where((x)=>x['kind']=='subject').toList();final topics=n.where((x)=>x['kind']=='topic').toList();final courses=listRows(widget.store.state,'courses').where((x)=>x['missionId']==widget.missionId).toList();return ListView(padding:const EdgeInsets.all(18),children:[
    const Text('Course + Revision',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),const SizedBox(height:4),const Text('Subject → Topic → Subtopic with source-grounded lessons.'),const SizedBox(height:14),
    Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(children:[
      Row(children:[Expanded(child:DropdownButtonFormField<String>(value:kind,items:const['subject','topic','subtopic'].map((x)=>DropdownMenuItem(value:x,child:Text(x))).toList(),onChanged:(v)=>setState(() { kind=v??'subject'; parent=null; }),decoration:const InputDecoration(labelText:'Node type'))),const SizedBox(width:8),if(kind!='subject')Expanded(child:DropdownButtonFormField<String>(value:parent,items:[const DropdownMenuItem<String>(value:null,child:Text('Select parent')),...(kind=='topic'?subjects:topics).map((x)=>DropdownMenuItem(value:x['id'].toString(),child:Text(x['name'].toString())))],onChanged:(v)=>setState(()=>parent=v),decoration:const InputDecoration(labelText:'Parent')))]),
      const SizedBox(height:10),TextField(onChanged:(v)=>name=v,decoration:const InputDecoration(labelText:'Node name')),const SizedBox(height:10),Align(alignment:Alignment.centerRight,child:FilledButton(onPressed:addNode,child:const Text('Add node'))),
    ]))),
    const SizedBox(height:12),
    Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('Source-grounded course builder',style:TextStyle(fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:4),const Text('Missing evidence creates a verification request instead of invented content.'),const SizedBox(height:10),TextField(onChanged:(v)=>topic=v,decoration:const InputDecoration(labelText:'Topic')),const SizedBox(height:10),FilledButton(onPressed:buildLesson,child:const Text('Build evidence lesson'))]))),
    if(courses.isNotEmpty) ...[const SizedBox(height:14),const Text('Evidence lessons',style:TextStyle(fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:8),for(final x in courses)Card(child:ExpansionTile(title:Text(x['title'].toString()),subtitle:Text((x['sourceChunkRefs'] as List? ?? []).length.toString()+' source chunk(s)'),children:[Padding(padding:const EdgeInsets.all(16),child:Align(alignment:Alignment.centerLeft,child:Text(x['body'].toString()))) ]))],
    if(n.isNotEmpty) ...[const SizedBox(height:14),const Text('Course tree',style:TextStyle(fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:8),for(final s in subjects)Card(child:ExpansionTile(title:Text('Subject: '+s['name'].toString()),children:[for(final t in n.where((x)=>x['parentId']==s['id']))ListTile(title:Text(t['kind'].toString()+': '+t['name'].toString()),subtitle:Text('Status: '+t['status'].toString()))]))],
  ]);}
}

class Readiness extends StatelessWidget{
  final StudyStore store;final String missionId;const Readiness({super.key,required this.store,required this.missionId});
  @override Widget build(BuildContext context){final a=listRows(store.state,'attempts').where((x)=>x['missionId']==missionId).toList();final r=listRows(store.state,'revisions').where((x)=>x['missionId']==missionId).toList();final n=listRows(store.state,'nodes').where((x)=>x['missionId']==missionId&&x['kind']=='topic').toList();final correct=a.where((x)=>x['isCorrect']==true).length;final acc=a.isEmpty?null:(correct*100/a.length).round();final done=n.where((x)=>x['status']=='completed').length;final cov=n.isEmpty?null:(done*100/n.length).round();final master=r.where((x)=>((x['repetitions'] as num?)?.toInt()??0)>=5).length;final stable=r.where((x)=>((x['repetitions'] as num?)?.toInt()??0)>=3).length;final ret=r.isEmpty?null:(((master+stable*.75)/r.length)*100).round();final due=r.where((x){final d=DateTime.tryParse((x['dueAt']??'').toString());return d!=null&&!d.isAfter(DateTime.now());}).length;final comps=[acc,cov,ret].whereType<int>().toList();final index=comps.isEmpty?null:(comps.reduce((a,b)=>a+b)/comps.length).round();return ListView(padding:const EdgeInsets.all(18),children:[const Text('Readiness',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),const SizedBox(height:4),Text('Mission: '+mission(missionId)['title'].toString()),const SizedBox(height:16),Card(child:Padding(padding:const EdgeInsets.all(22),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('READINESS INDEX',style:TextStyle(fontSize:11,fontWeight:FontWeight.w800)),const SizedBox(height:4),Text(index==null?'—':index.toString()+'%',style:const TextStyle(fontSize:46,fontWeight:FontWeight.w900))]))),const SizedBox(height:10),GridView.count(crossAxisCount:2,shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),crossAxisSpacing:8,mainAxisSpacing:8,children:[Metric(label:'Coverage',value:cov==null?'—':cov.toString()+'%',icon:Icons.account_tree),Metric(label:'Accuracy',value:acc==null?'—':acc.toString()+'%',icon:Icons.check_circle),Metric(label:'Retention',value:ret==null?'—':ret.toString()+'%',icon:Icons.memory),Metric(label:'Due revisions',value:due.toString(),icon:Icons.refresh)]),const SizedBox(height:14),Card(child:Padding(padding:const EdgeInsets.all(16),child:Text('PYQ, weakness, attempts and revision history are retained locally and feed later adaptive selections.')))]);}
}

class Chat extends StatefulWidget{
  final StudyStore store;final String missionId;const Chat({super.key,required this.store,required this.missionId});@override State<Chat> createState()=>_ChatState();
}
class _ChatState extends State<Chat>{
  final input=TextEditingController();final messages=<Map<String,String>>[{'role':'assistant','text':'Ask about a topic. I search indexed evidence first.'}];
  @override void dispose(){input.dispose();super.dispose();}
  void ask(){final q=input.text.trim();if(q.isEmpty)return;final terms=q.toLowerCase().split(RegExp(r'\s+'));final chunks=listRows(widget.store.state,'chunks').where((x)=>x['missionId']==widget.missionId).toList();final hits=chunks.map((c){final t=c['text'].toString().toLowerCase();return {'c':c,'score':terms.fold<int>(0,(a,w)=>a+(t.contains(w)?1:0))};}).where((x)=>(x['score'] as int)>0).toList()..sort((a,b)=>(b['score'] as int).compareTo(a['score'] as int));messages.add({'role':'user','text':q});if(hits.isEmpty){final vr=listRows(widget.store.state,'verificationRequests');vr.insert(0,{'id':newId('verify'),'missionId':widget.missionId,'topic':q,'reason':'No matching indexed source evidence.','status':'needs-external-verification','createdAt':DateTime.now().toIso8601String()});widget.store.state['verificationRequests']=vr;widget.store.save();widget.store.notifyListeners();messages.add({'role':'assistant','text':'No matching PDF/source evidence found. External Verification request created; no answer was invented.'});}else{messages.add({'role':'assistant','text':hits.take(4).map((x){final c=x['c'] as Map;return '['+c['locator'].toString()+'] '+c['text'].toString();}).join('\n\n')});}input.clear();setState((){});}
  @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('AI Study Chat')),body:Column(children:[Expanded(child:ListView(padding:const EdgeInsets.all(14),children:[for(final m in messages)Align(alignment:m['role']=='user'?Alignment.centerRight:Alignment.centerLeft,child:Container(constraints:const BoxConstraints(maxWidth:780),margin:const EdgeInsets.only(bottom:8),padding:const EdgeInsets.all(12),decoration:BoxDecoration(color:m['role']=='user'?Theme.of(context).colorScheme.primaryContainer:Colors.white10,borderRadius:BorderRadius.circular(14)),child:Text(m['text']??'')))])),SafeArea(top:false,child:Padding(padding:const EdgeInsets.all(10),child:Row(children:[Expanded(child:TextField(controller:input,onSubmitted:(_)=>ask(),decoration:const InputDecoration(hintText:'Ask about indexed sources…'))),const SizedBox(width:8),FilledButton(onPressed:ask,child:const Text('Ask'))])))]));
}

class QuestionStudio extends StatefulWidget{
  final StudyStore store;final String missionId;const QuestionStudio({super.key,required this.store,required this.missionId});@override State<QuestionStudio> createState()=>_QuestionStudioState();
}
class _QuestionStudioState extends State<QuestionStudio>{
  final stem=TextEditingController(),topic=TextEditingController(text:'general'),a=TextEditingController(),b=TextEditingController(),c=TextEditingController(),d=TextEditingController(),year=TextEditingController(),exam=TextEditingController(),paper=TextEditingController();String type='concept',difficulty='medium';String? sourceId,chunkId;int correct=0;
  @override void dispose(){for(final x in[stem,topic,a,b,c,d,year,exam,paper])x.dispose();super.dispose();}
  void add(){final opts=[{'id':'a','text':a.text.trim()},{'id':'b','text':b.text.trim()},{'id':'c','text':c.text.trim()},{'id':'d','text':d.text.trim()}];if(stem.text.trim().isEmpty||opts.any((x)=>(x['text'] as String).isEmpty)||sourceId==null||chunkId==null){_msg('Stem, all options, source and chunk are required.');return;}if(type=='pyq'&&int.tryParse(year.text.trim())==null){_msg('PYQ requires a year.');return;}final q=listRows(widget.store.state,'questions');q.insert(0,{'id':newId('question'),'missionId':widget.missionId,'subjectId':'custom','topicId':topic.text.trim().isEmpty?'general':topic.text.trim(),'questionType':type,'sourceRefs':[sourceId],'sourceChunkRefs':[chunkId],'stem':stem.text.trim(),'options':opts,'correctOptionId':opts[correct]['id'],'explanation':'Answer is grounded in the selected source chunk.','difficulty':difficulty,'pyq':{'year':int.tryParse(year.text.trim()),'exam':exam.text.trim(),'paper':paper.text.trim()}});widget.store.state['questions']=q;widget.store.save();widget.store.notifyListeners();_msg('Source-grounded question added.');stem.clear();for(final x in[a,b,c,d])x.clear();}
  void _msg(String s)=>ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(s)));
  @override Widget build(BuildContext context){final sources=listRows(widget.store.state,'sources').where((x)=>x['missionId']==widget.missionId).toList();final chunks=listRows(widget.store.state,'chunks').where((x)=>x['missionId']==widget.missionId&&(sourceId==null||x['sourceId']==sourceId)).toList();return Scaffold(appBar:AppBar(title:const Text('Question Studio')),body:ListView(padding:const EdgeInsets.all(16),children:[const Text('Validate & add a source-grounded MCQ',style:TextStyle(fontSize:22,fontWeight:FontWeight.w800)),const SizedBox(height:8),const Text('A question is admitted only with a source and source-chunk reference.'),const SizedBox(height:14),Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(children:[DropdownButtonFormField<String>(value:type,items:const['concept','fact','application','pyq'].map((x)=>DropdownMenuItem(value:x,child:Text(x))).toList(),onChanged:(v)=>setState(()=>type=v??'concept'),decoration:const InputDecoration(labelText:'Question type')),TextField(controller:topic,decoration:const InputDecoration(labelText:'Topic')),DropdownButtonFormField<String>(value:difficulty,items:const['easy','medium','hard'].map((x)=>DropdownMenuItem(value:x,child:Text(x))).toList(),onChanged:(v)=>setState(()=>difficulty=v??'medium'),decoration:const InputDecoration(labelText:'Difficulty')),TextField(controller:stem,maxLines:3,decoration:const InputDecoration(labelText:'Question stem')),for(final e in[['A',a],['B',b],['C',c],['D',d]])TextField(controller:e[1] as TextEditingController,decoration:InputDecoration(labelText:'Option '+e[0].toString())),DropdownButtonFormField<int>(value:correct,items:const[DropdownMenuItem(value:0,child:Text('A')),DropdownMenuItem(value:1,child:Text('B')),DropdownMenuItem(value:2,child:Text('C')),DropdownMenuItem(value:3,child:Text('D'))],onChanged:(v)=>setState(()=>correct=v??0),decoration:const InputDecoration(labelText:'Correct option')),DropdownButtonFormField<String>(value:sourceId,items:[const DropdownMenuItem<String>(value:null,child:Text('Select source')),...sources.map((x)=>DropdownMenuItem(value:x['id'].toString(),child:Text(x['title'].toString())))],onChanged:(v)=>setState(() { sourceId=v; chunkId=null; }),decoration:const InputDecoration(labelText:'Source')),DropdownButtonFormField<String>(value:chunkId,items:[const DropdownMenuItem<String>(value:null,child:Text('Select source chunk')),...chunks.map((x)=>DropdownMenuItem(value:x['id'].toString(),child:Text(x['id'].toString())))],onChanged:(v)=>setState(()=>chunkId=v),decoration:const InputDecoration(labelText:'Source chunk')),if(type=='pyq')... [TextField(controller:year,keyboardType:TextInputType.number,decoration:const InputDecoration(labelText:'PYQ year')),TextField(controller:exam,decoration:const InputDecoration(labelText:'PYQ exam')),TextField(controller:paper,decoration:const InputDecoration(labelText:'PYQ paper'))],const SizedBox(height:12),SizedBox(width:double.infinity,child:FilledButton(onPressed:add,child:const Text('Validate & Add')))]))]));}
}

class ExternalVerification extends StatefulWidget{final StudyStore store;final String missionId;const ExternalVerification({super.key,required this.store,required this.missionId});@override State<ExternalVerification> createState()=>_ExternalVerificationState();}
class _ExternalVerificationState extends State<ExternalVerification>{
  final url=TextEditingController(),publisher=TextEditingController(),evidence=TextEditingController(),title=TextEditingController();
  @override void dispose(){url.dispose();publisher.dispose();evidence.dispose();title.dispose();super.dispose();}
  Future<void> attach(Map<String,dynamic> request) async{title.text=request['topic'].toString();final ok=await showDialog<bool>(context:context,builder:(_)=>AlertDialog(title:const Text('Attach external evidence'),content:SingleChildScrollView(child:Column(mainAxisSize:MainAxisSize.min,children:[TextField(controller:title,decoration:const InputDecoration(labelText:'Title')),TextField(controller:publisher,decoration:const InputDecoration(labelText:'Publisher')),TextField(controller:url,decoration:const InputDecoration(labelText:'HTTPS URL')),TextField(controller:evidence,maxLines:8,decoration:const InputDecoration(labelText:'Evidence text'))])),actions:[TextButton(onPressed:()=>Navigator.pop(context,false),child:const Text('Cancel')),FilledButton(onPressed:()=>Navigator.pop(context,true),child:const Text('Save'))]));if(ok!=true)return;final link=url.text.trim();final host=Uri.tryParse(link)?.host.toLowerCase()??'';final trusted=link.startsWith('https://')&&(host.endsWith('.gov.in')||host.endsWith('.nic.in')||host.endsWith('.ac.in')||host=='upsc.gov.in'||host=='uppsc.up.nic.in');if(!trusted||evidence.text.trim().isEmpty){_msg('Use an HTTPS trusted-domain URL and provide evidence text.');return;}final sid=newId('external');final ss=listRows(widget.store.state,'sources');ss.insert(0,{'id':sid,'missionId':widget.missionId,'title':title.text.trim(),'type':'external-url','status':'verified','authority':'trusted-external','evidenceLayer':'trusted-external','url':link,'publisher':publisher.text.trim(),'addedAt':DateTime.now().toIso8601String()});final ch=listRows(widget.store.state,'chunks');final parts=_chunk(evidence.text);for(var i=0;i<parts.length;i++)ch.add({'id':sid+':external-'+(i+1).toString(),'sourceId':sid,'missionId':widget.missionId,'locator':link+'#evidence-'+(i+1).toString(),'text':parts[i],'order':i,'evidenceLayer':'trusted-external','sourceUrl':link,'publisher':publisher.text.trim()});final req=listRows(widget.store.state,'verificationRequests');final updated=Map<String,dynamic>.from(request);updated['status']='verified-evidence-attached';updated['sourceId']=sid;widget.store.state['sources']=ss;widget.store.state['chunks']=ch;widget.store.state['verificationRequests']=req.map((x)=>x['id']==request['id']?updated:x).toList();await widget.store.save();widget.store.notifyListeners();_msg('External evidence attached and indexed.');}
  void _msg(String s)=>ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(s)));
  @override Widget build(BuildContext context){final req=listRows(widget.store.state,'verificationRequests').where((x)=>x['missionId']==widget.missionId).toList();return Scaffold(appBar:AppBar(title:const Text('External Verification')),body:ListView(padding:const EdgeInsets.all(16),children:[const Text('Verification queue',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),const SizedBox(height:6),const Text('Missing source evidence is queued here instead of being guessed.'),const SizedBox(height:14),if(req.isEmpty)const _Empty(text:'No verification requests.')else for(final x in req)Card(child:ListTile(title:Text(x['topic'].toString()),subtitle:Text(x['status'].toString()),trailing:FilledButton(onPressed:()=>attach(x),child:const Text('Attach')))),const SizedBox(height:12),const Card(child:Padding(padding:EdgeInsets.all(12),child:Text('The app records the URL and evidence text. Domain allowlisting is a guard, not independent authentication of the copied content.')))]);}
}

class Backup extends StatefulWidget{final StudyStore store;const Backup({super.key,required this.store});@override State<Backup> createState()=>_BackupState();}
class _BackupState extends State<Backup>{
  bool busy=false;
  Future<void> saveBackup() async{setState(()=>busy=true);try{await FilePicker.saveFile(fileName:'potential-pathway-backup.json',bytes:Uint8List.fromList(utf8.encode(jsonEncode(widget.store.state))),mimeType:'application/json');_msg('Backup exported.');}catch(e){_msg('Backup failed: '+e.toString());}finally{if(mounted)setState(()=>busy=false);}}
  Future<void> loadBackup() async{setState(()=>busy=true);try{final f=await FilePicker.pickFile(type:FileType.custom,allowedExtensions:['json']);if(f==null)return;final d=jsonDecode(utf8.decode(await f.readAsBytes(),allowMalformed:true));if(d is! Map)throw Exception('Invalid backup.');await widget.store.replaceState(Map<String,dynamic>.from(d));_msg('Backup restored.');}catch(e){_msg('Restore failed: '+e.toString());}finally{if(mounted)setState(()=>busy=false);}}
  void _msg(String s)=>ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(s)));
  @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Backup & Restore')),body:ListView(padding:const EdgeInsets.all(18),children:[const Text('Protect local study data',style:TextStyle(fontSize:24,fontWeight:FontWeight.w800)),const SizedBox(height:6),const Text('Progress, evidence chunks, questions, course nodes and verification records are included.'),const SizedBox(height:16),Card(child:Padding(padding:const EdgeInsets.all(18),child:Column(children:[SizedBox(width:double.infinity,child:FilledButton.icon(onPressed:busy?null:saveBackup,icon:const Icon(Icons.upload),label:const Text('Export backup'))),const SizedBox(height:10),SizedBox(width:double.infinity,child:OutlinedButton.icon(onPressed:busy?null:loadBackup,icon:const Icon(Icons.download),label:const Text('Restore backup')))]))) ]));
}

class Mock extends StatelessWidget{final StudyStore store;final String missionId;const Mock({super.key,required this.store,required this.missionId});@override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Mock Test')),body:Practice(store:store,missionId:missionId,mock:true));}

class _Empty extends StatelessWidget{final String text;const _Empty({required this.text});@override Widget build(BuildContext context)=>Card(child:Padding(padding:const EdgeInsets.all(22),child:Center(child:Text(text))));}

List<String> _chunk(String input,{int maxLength=1400}){final s=input.replaceAll('\n',' ').replaceAll('\r',' ').replaceAll(RegExp(r'\s+'),' ').trim();final out=<String>[];var start=0;while(start<s.length){final end=math.min(start+maxLength,s.length);final part=s.substring(start,end).trim();if(part.isNotEmpty)out.add(part);start=end;}return out;}
