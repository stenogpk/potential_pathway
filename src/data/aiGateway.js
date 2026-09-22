export function createAiDraftRequest({ missionId, topic, chunks = [] } = {}) {
  const context = chunks.filter((c)=>String(c.text||"").trim()).slice(0,12).map((c)=>({sourceId:c.sourceId,chunkId:c.id,text:c.text,evidenceLayer:c.evidenceLayer,sourceUrl:c.sourceUrl||null}));
  return { missionId, topic:String(topic||"").trim(), context, instructions:"Generate only from supplied evidence. Every claim must cite sourceId and chunkId. If evidence is insufficient, request external verification.", status:context.length?"ready":"blocked"};
}
export function validateAiDraftEvidence(request, chunks = []) {
  if (!request?.missionId || !request?.topic) return {valid:false,reason:"Mission and topic are required."};
  if (!request.context?.length) return {valid:false,reason:"No indexed source evidence is available. AI generation is blocked."};
  const known=new Set(chunks.map(c=>c.id));
  if(request.context.some(c=>!known.has(c.chunkId))) return {valid:false,reason:"AI context contains an unknown source chunk."};
  return {valid:true,reason:""};
}
