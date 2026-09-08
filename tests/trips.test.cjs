const {test}=require('node:test')
const assert=require('node:assert/strict')
const d=require('../.test-build/domain/trips.js')
const {activities,activityById}=require('../.test-build/data/discoveryData.js')
const request=(destination,seedActivityId)=>({...d.DEFAULT_PREFERENCES,destination,seedActivityId,startDate:'2026-11-12',endDate:'2026-11-19',travellers:2,budgetPerPerson:4500})
test('dates are inclusive, money and member counts survive creation',()=>{
  const t=d.createTrip(request('shanghai','shanghai-disney-10'))
  assert.equal(t.city,'Shanghai');assert.equal(t.country,'China');assert.equal(t.days.length,8);assert.equal(t.members.length,2);assert.equal(d.tripBudget(t),9000)
  assert.deepEqual(t.mobility,['Low walking']);assert.deepEqual(t.interests,['Food','Culture'])
  assert.equal(t.days[1].stops.filter(s=>s.activityId==='shanghai-disney-10').length,1)
  assert.equal(d.dayIssues(t.days[1].stops,t,2).filter(s=>s.startsWith('Allow more')).length,0)
})
test('every destination is mapped correctly and a seed cannot cross destinations',()=>{
  for(const activity of activities){const destination=d.destinationOf(activity);assert.ok(d.DESTINATIONS[destination]);const t=d.createTrip(request(destination,activity.id));assert.ok(t.days.some(day=>day.stops.some(s=>s.activityId===activity.id)))}
  const t=d.createTrip(request('tokyo','iceland-aurora'));assert.equal(t.days.flatMap(day=>day.stops).filter(s=>s.activityId).length,0)
  assert.equal(d.activityFitsTrip(activityById('gion-evening'),t),false)
  assert.equal(d.activityFitsTrip(activityById('shibuya-sky-golden-hour'),t),true)
})
test('shared summary math is derived, not hard-coded',()=>{const t=d.seedTokyo();assert.equal(t.days.length,7);assert.equal(t.travellers,4);assert.equal(d.tripSpent(t),8640);assert.equal(d.tripBudget(t)-d.tripSpent(t),19360);t.expenses.push({amount:120});assert.equal(d.tripBudget(t)-d.tripSpent(t),19240)})
test('each same-city trip has independent identity and data',()=>{const a=d.createTrip(request('tokyo'));const b=d.createTrip(request('tokyo'));assert.notEqual(a.id,b.id);a.days[0].stops[0].title='Changed';assert.notEqual(b.days[0].stops[0].title,'Changed');a.mobility=[...a.mobility,'Step-free'];assert.notDeepEqual(a.mobility,b.mobility)})
test('rest proposal is immutable and idempotent',()=>{const t=d.seedTokyo();const before=JSON.stringify(t);const changed=d.softenDay(t,2);assert.equal(JSON.stringify(t),before);assert.equal(changed.days[1].stops.length,t.days[1].stops.length+1);assert.equal(changed.days[1].stops.filter(s=>s.title==='A little breathing room').length,1);assert.equal(d.softenDay(changed,2),changed);assert.equal(d.tripSpent(changed),d.tripSpent(t));assert.equal(d.dayIssues(changed.days[1].stops,changed,2).length,0)})
test('rest adjustment cannot overflow midnight or change an empty day',()=>{const t=d.seedTokyo();assert.equal(d.softenDay(t,4),t);t.days[1].stops=[d.makeStop('Late viewing','23:30','activity',30)];assert.equal(d.softenDay(t,2),t)})
test('reordering keeps identity and allows connection time',()=>{const t=d.seedTokyo();const changed=d.reorderDay(t,2,0,2);assert.equal(changed.days[1].stops[2].id,t.days[1].stops[0].id);assert.equal(changed.days[1].stops.length,t.days[1].stops.length);assert.equal(d.dayIssues(changed.days[1].stops,changed,2).length,0);assert.equal(t.days[1].stops[0].time,'10:00')})
test('overlap, season, access and food warnings are explicit',()=>{const t=d.seedTokyo();const a=d.stopFromActivity(activityById('gion-evening'),'10:00');t.days[1].stops.push(a);t.dietary=['Allergy-aware'];const issues=d.dayIssues(t.days[1].stops,t,2);assert.ok(issues.some(s=>s.includes('Allow more time')));assert.ok(issues.some(s=>s.includes('seasonal window')));assert.ok(issues.some(s=>s.includes('step-free access')));assert.ok(issues.some(s=>s.includes('dietary requests')))})
test('season windows are dates, not promotional badge text',()=>{assert.equal(d.inSeason(activityById('iceland-aurora'),'2026-09-13'),false);assert.equal(d.inSeason(activityById('iceland-aurora'),'2027-01-10'),true);assert.equal(d.inSeason(activityById('shanghai-disney-10'),'2026-09-13'),true);assert.equal(d.inSeason(activityById('shanghai-disney-10'),'2027-09-13'),false)})
test('invalid ids and invalid setup fail safely',()=>{assert.equal(activityById('does-not-exist'),undefined);assert.throws(()=>d.createTrip({...request('tokyo'),endDate:'2026-11-01'}));assert.throws(()=>d.createTrip({...request('tokyo'),travellers:0}));assert.throws(()=>d.createTrip({...request('tokyo'),budgetPerPerson:NaN}));assert.throws(()=>d.createTrip({...request('tokyo'),endDate:'2027-01-01'}))})

test('parallel member plans do not create false transfer warnings',()=>{
  const t=d.seedTokyo()
  const stops=[{...d.makeStop('Your museum','10:00','activity',90),participantIds:['you']},{...d.makeStop('Louise meeting','10:30','activity',60),participantIds:['member-1']},d.makeStop('Shared lunch','12:00','meal',60)]
  assert.deepEqual(d.dayIssues(stops,t,2),[])
})

test('an interleaved separate plan cannot hide a traveller conflict',()=>{
  const t=d.seedTokyo()
  const stops=[{...d.makeStop('Your museum','10:00','activity',120),participantIds:['you']},{...d.makeStop('Other meeting','10:15','activity',30),participantIds:['member-1']},{...d.makeStop('Your gallery','11:30','activity',60),participantIds:['you']}]
  assert.deepEqual(d.dayIssues(stops,t,2),['Allow more time between Your museum and Your gallery.'])
})

test('shared stop checks each traveller next connection rather than only the first branch',()=>{
  const t=d.seedTokyo()
  const stops=[d.makeStop('Shared breakfast','10:00','meal',60),{...d.makeStop('Your walk','11:10','activity',30),participantIds:['you']},{...d.makeStop('Louise meeting','11:05','activity',30),participantIds:['member-1']}]
  assert.deepEqual(d.dayIssues(stops,t,2),['Allow more time between Shared breakfast and Louise meeting.'])
})

test('a gentler split day keeps the other members commitment and assigns the rest correctly',()=>{
  const t=d.seedTokyo()
  t.days[1].stops=[{...d.makeStop('Your museum','10:00','activity',90),participantIds:['you']},{...d.makeStop('Other meeting','11:00','activity',90),participantIds:['member-1']},{...d.makeStop('Your lunch','12:00','meal',60),participantIds:['you']},d.makeStop('Together again','13:30','meal',60)]
  const before=JSON.stringify(t)
  const changed=d.softenDay(t,2)
  assert.equal(JSON.stringify(t),before)
  const stops=changed.days[1].stops
  assert.deepEqual(stops.find(s=>s.title==='A little breathing room').participantIds,['you'])
  assert.equal(stops.find(s=>s.title==='Other meeting').time,'11:00')
  assert.equal(stops.find(s=>s.title==='Your lunch').time,'12:25')
  assert.equal(stops.find(s=>s.title==='Together again').time,'13:35')
  assert.deepEqual(d.dayIssues(stops,changed,2),[])
})

test('reorder rejects invalid positions and leaves a no-op unchanged',()=>{
  const t=d.seedTokyo()
  for(const [from,to] of [[NaN,1],[0,NaN],[0.5,1],[0,1.5],[0,0]])assert.equal(d.reorderDay(t,2,from,to),t)
})

test('trip stage follows the selected demo chapter and ordinary trips use the local date',()=>{
  const t=d.seedTokyo()
  assert.equal(d.tripStage(t),'upcoming')
  t.demoPhase='during'
  assert.equal(d.tripStage(t),'travelling')
  const now=new Date()
  const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const normal=d.createTrip({...request('tokyo'),startDate:today,endDate:today})
  assert.equal(d.tripStage(normal),'travelling')
})
