import { useState } from 'react'
import { activities } from '../../data/discoveryData'
import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'
type Props={onClose:()=>void;onSelect:(id:string)=>void;onSearch:(query:string)=>void}
export function SearchSheet({onClose,onSelect,onSearch}:Props){
  const [query,setQuery]=useState('')
  const matches=activities.filter(a=>`${a.title} ${a.location} ${a.country} ${a.mood} ${a.mobilityTags.join(' ')} ${a.audiences.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <BottomSheet label="Search travel ideas" onDismiss={onClose} className="search-sheet"><header><h2>A place on your mind?</h2><button aria-label="Close search" onClick={onClose}><Icon name="close"/></button></header><form onSubmit={e=>{e.preventDefault();onSearch(query)}}><label className="search-field"><Icon name="search"/><input aria-label="Search destinations" placeholder="Tokyo, Kyoto, family, step-free…" value={query} onChange={e=>setQuery(e.target.value)}/></label></form><p>{query?'Matching places':'Try a destination'}</p><div className="search-results">{matches.slice(0,5).map(a=><button key={a.id} onClick={()=>onSelect(a.id)}><img src={a.image} alt=""/><span><strong>{a.title}</strong><small>{a.location}, {a.country}</small></span><Icon name="arrow" size={15}/></button>)}</div>{!matches.length&&<p>No matching places in this prototype. Try a destination or “family”.</p>}<button className="j-secondary" onClick={()=>onSearch(query)}>See results in Discover</button></BottomSheet>
}
