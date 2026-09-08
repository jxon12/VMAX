import { useState } from 'react'
import type { Trip } from '../../types/trips'
import { dateRange } from '../../domain/trips'
import { Icon } from '../ui/Icon'
import { BottomSheet } from '../ui/BottomSheet'
import { FLIGHT_SHORTLIST_ID } from '../../domain/assistant'
export function JourneyEssentials({trip,section,onClose,onUpdate}:{trip:Trip;section:'documents'|'checklist';onClose:()=>void;onUpdate:(update:(trip:Trip)=>Trip)=>void}){
  const [sample,setSample]=useState(false);const [item,setItem]=useState('')
  return <BottomSheet label={section==='documents'?'Travel documents':'Departure checklist'} className="j-sheet" onDismiss={onClose}><header><h2>{section==='documents'?'Everything at hand.':'Before you take off.'}</h2><button aria-label="Close essentials" onClick={onClose}><Icon name="close"/></button></header><p className="j-muted">{trip.city} · {dateRange(trip)}</p>
    {section==='documents'?<>
      <p className="fine-print">Prototype document notes. Use sample information only; notes stay on this device. No bookings or actual tickets are retrieved.</p>
      {trip.documents.map(doc=>doc.id===FLIGHT_SHORTLIST_ID?<article className="j-document" key={doc.id}><div><Icon name="plane"/><strong>{doc.title}</strong></div><p className="j-muted">{doc.detail}</p><small className="fine-print">UNBOOKED COMPARISON · NOT A TRAVEL DOCUMENT</small></article>:<div className="j-document" key={doc.id}>
        <div><Icon name={doc.id==='flight'?'plane':'document'}/><strong>{doc.title}</strong></div>
        <label className="field-label">Reference / note<input aria-label={`${doc.title} note`} value={doc.detail} onChange={e=>onUpdate(t=>({...t,documents:t.documents.map(d=>d.id===doc.id?{...d,detail:e.target.value}:d)}))}/></label>
        <label className="j-check-row"><input type="checkbox" checked={doc.ready} onChange={()=>onUpdate(t=>({...t,documents:t.documents.map(d=>d.id===doc.id?{...d,ready:!d.ready}:d)}))}/><span>I have this document ready</span></label>
        {doc.sample&&<button className="j-secondary" onClick={()=>setSample(!sample)}>{sample?'Hide':'View'} sample pass</button>}
      </div>)}
      {sample&&<div className="j-sample-pass"><small>DEMO ONLY · NOT VALID FOR TRAVEL</small><h3>Flight pass preview</h3><p>{trip.city} · {dateRange(trip)}</p><div>Flight — &nbsp; Gate — &nbsp; Seat —</div><p>No live flight data. Keep the airline’s actual pass in your wallet.</p></div>}
    </>:<><p className="j-muted">{trip.checklist.filter(i=>i.done).length} of {trip.checklist.length} ready. Your changes are saved.</p><div className="j-checklist">{trip.checklist.map(check=><label className="j-check-row" key={check.id}><input type="checkbox" checked={check.done} onChange={()=>onUpdate(t=>({...t,checklist:t.checklist.map(c=>c.id===check.id?{...c,done:!c.done}:c)}))}/><span>{check.label}</span></label>)}</div><form className="j-inline-form" onSubmit={e=>{e.preventDefault();if(item.trim())onUpdate(t=>({...t,checklist:[...t.checklist,{id:crypto.randomUUID(),label:item.trim(),done:false}]}));setItem('')}}><input aria-label="New checklist item" placeholder="Something else to remember…" maxLength={120} value={item} onChange={e=>setItem(e.target.value)}/><button className="j-secondary" disabled={!item.trim()}>Add</button></form></>}
  </BottomSheet>
}
