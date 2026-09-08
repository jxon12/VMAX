import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import '../../styles/sheets.css'
type Props={label:string;children:ReactNode;onDismiss:()=>void;className?:string;phase?:'opening'|'closing'}
export function BottomSheet({label,children,onDismiss,className='',phase='opening'}:Props){
  const ref=useRef<HTMLElement>(null); const dismiss=useRef(onDismiss);dismiss.current=onDismiss
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null; const overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const focusable=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')??[]).filter(e=>e.offsetParent!==null)
    ;(focusable()[0]??ref.current)?.focus()
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.stopPropagation();dismiss.current()}
      if(event.key==='Tab'){const items=focusable();const first=items[0];const last=items[items.length-1];if(!first){event.preventDefault();return}if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
    }
    document.addEventListener('keydown',key)
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus()}
  },[])
  return <div className={`sheet-backdrop ${phase}`} onClick={onDismiss}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={`bottom-sheet ${className} ${phase}`} onClick={(e:MouseEvent)=>e.stopPropagation()}><div className="sheet-handle"/>{children}</section></div>
}
