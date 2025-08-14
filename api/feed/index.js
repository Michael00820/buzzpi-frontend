export default async function handler(req, res){
  const items = [
    { id:'t1', type:'bonus', title:'Weekly Bonus', body:'Top streamer got a performance reward!', ts: Date.now()-3600_000 },
    { id:'t2', type:'notice', title:'New Filters', body:'Beauty & mask filters available in studio.', ts: Date.now()-7200_000 },
  ];
  res.status(200).json({ ok:true, items });
}
