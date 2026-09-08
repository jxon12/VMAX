import type { Preferences } from '../../types/trips'
const mobilityOptions=['Step-free','Low walking','Seating available']
const dietaryOptions=['Vegetarian','Halal-friendly','Allergy-aware']
export function PreferenceFields({value,onChange}:{value:Preferences;onChange:(value:Preferences)=>void}){
  const toggle=(key:'mobility'|'dietary'|'interests'|'travellerTypes',option:string)=>{const items=value[key]??[];onChange({...value,[key]:items.includes(option)?items.filter(v=>v!==option):[...items,option]})}
  return <div className="preference-fields">
    <fieldset><legend>Who are we planning around?</legend><p>Optional. Choose comfort needs below—age alone doesn’t define ability.</p><div>{['Children','Older travellers','Accessibility needs'].map(option=><button type="button" key={option} aria-pressed={(value.travellerTypes??[]).includes(option)} onClick={()=>toggle('travellerTypes',option)}>{option}</button>)}</div></fieldset>
    <fieldset><legend>Mobility & comfort</legend><p>Choose all that help your group.</p><div>{mobilityOptions.map(option=><button type="button" key={option} aria-pressed={value.mobility.includes(option)} onClick={()=>toggle('mobility',option)}>{option}</button>)}</div></fieldset>
    <fieldset><legend>Food preferences</legend><p>Requests to confirm with each venue—not guarantees.</p><div>{dietaryOptions.map(option=><button type="button" key={option} aria-pressed={value.dietary.includes(option)} onClick={()=>toggle('dietary',option)}>{option}</button>)}</div></fieldset>
    <label className="field-label">Travel pace<select value={value.pace} onChange={e=>onChange({...value,pace:e.target.value})}>{['Slow & relaxed','Balanced days','Full, active days','Flexible by day'].map(option=><option key={option}>{option}</option>)}</select></label>
    <fieldset><legend>Interests</legend><div>{['Food','Culture','Shopping','Nightlife','Nature'].map(option=><button type="button" key={option} aria-pressed={value.interests.includes(option)} onClick={()=>toggle('interests',option)}>{option}</button>)}</div></fieldset>
  </div>
}
