import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const STATUS_COLORS = {
  todo:       { color: "#3b82f6", label: "To Do" },
  inprogress: { color: "#f59e0b", label: "In Progress" },
  inreview:   { color: "#8b5cf6", label: "In Review" },
  done:       { color: "#22c55e", label: "Done" },
};
const PRIORITY_COLORS = { High:"#ef4444", Medium:"#f59e0b", Low:"#3b82f6" };
const ROLES = ["member","developer","admin"];
const DEPARTMENTS = [
  "Frontend Engineering","Backend Engineering","Full Stack Engineering",
  "Mobile Development","DevOps & Infrastructure","Cloud Engineering",
  "Platform Engineering","Embedded Systems","QA & Testing","Security Engineering",
  "Product Management","UX Design","UI Design","Product Design","Design Systems",
  "Data Engineering","Data Science","Machine Learning","AI Research",
  "Business Intelligence","Analytics","Project Management","Scrum / Agile",
  "Technical Writing","Customer Success","Sales Engineering","Marketing Technology",
  "Finance & Operations","Research & Development","IT Support","HR Technology","Legal & Compliance",
];
const ROLE_STYLE = {
  admin:     { bg:"bg-red-50",    text:"text-red-600",    border:"border-red-200" },
  developer: { bg:"bg-purple-50", text:"text-purple-600", border:"border-purple-200" },
  member:    { bg:"bg-gray-100",  text:"text-gray-600",   border:"border-gray-200" },
};
function stringToColor(str) {
  const c=["#4f86c6","#e67e22","#2ecc71","#9b59b6","#e74c3c","#1abc9c","#f39c12","#3498db"];
  let h=0; for(let i=0;i<str.length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  return c[Math.abs(h)%c.length];
}

function UserModal({ user, tasks, onClose, onUpdate, onDelete }) {
  const [name,setName]=useState(user.name);
  const [email,setEmail]=useState(user.email);
  const [role,setRole]=useState(user.role||"member");
  const [department,setDepartment]=useState(user.department||"");
  const [loading,setLoading]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const userTasks=tasks.filter(t=>t.user_id===user.id);
  const donePct=userTasks.length>0?Math.round((userTasks.filter(t=>t.status==="done").length/userTasks.length)*100):0;
  const handleSave=async()=>{
    if(!name.trim()) return toast.error("Name required");
    if(!/\S+@\S+\.\S+/.test(email)) return toast.error("Valid email required");
    setLoading(true); await onUpdate({...user,name:name.trim(),email:email.trim(),role,department}); setLoading(false);
  };
  const handleDelete=async()=>{ setLoading(true); await onDelete(user.id); setLoading(false); };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{background:stringToColor(user.name)}}>{user.name[0].toUpperCase()}</div>
          <div className="flex-1"><h2 className="text-base font-bold text-gray-800">Edit Member</h2>
            <p className="text-xs text-gray-400">{userTasks.length} tasks · {donePct}% done</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Name *</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email *</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Role</label>
            <div className="flex gap-2">{ROLES.map(r=>(
              <button key={r} onClick={()=>setRole(r)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${role===r?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>{r}</button>
            ))}</div></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Department</label>
            <select value={department} onChange={e=>setDepartment(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Select department...</option>
              <optgroup label="── Engineering ──">{DEPARTMENTS.slice(0,10).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
              <optgroup label="── Product & Design ──">{DEPARTMENTS.slice(10,15).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
              <optgroup label="── Data & AI ──">{DEPARTMENTS.slice(15,21).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
              <optgroup label="── Business & Operations ──">{DEPARTMENTS.slice(21,28).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
              <optgroup label="── Other ──">{DEPARTMENTS.slice(28).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
            </select></div>
          {userTasks.length>0&&(
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Breakdown</p>
              <div className="flex gap-2 flex-wrap">{Object.entries(STATUS_COLORS).map(([k,v])=>{
                const cnt=userTasks.filter(t=>t.status===k).length; if(!cnt) return null;
                return <span key={k} className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{background:v.color+"22",color:v.color}}>{v.label}: {cnt}</span>;
              })}</div></div>)}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
          {!confirmDel
            ? <button onClick={()=>setConfirmDel(true)} className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️ Delete member</button>
            : <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Sure?</span>
                <button onClick={handleDelete} disabled={loading} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">Yes, delete</button>
                <button onClick={()=>setConfirmDel(false)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg">Cancel</button>
              </div>}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow disabled:opacity-50 flex items-center gap-2">
              {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>:"Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Summary() {
  const { projectId } = useParams();
  const [tasks,setTasks]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editUser,setEditUser]=useState(null);
  const [showAddUser,setShowAddUser]=useState(false);
  const [newName,setNewName]=useState("");
  const [newEmail,setNewEmail]=useState("");
  const [newRole,setNewRole]=useState("member");
  const [newDept,setNewDept]=useState("");
  const [creating,setCreating]=useState(false);

  const loadData=()=>{
    Promise.all([
      fetch(`http://localhost:8000/api/tasks?project_id=${projectId}`,{headers:{"Cache-Control":"no-store"}}).then(r=>r.json()),
      fetch(`http://localhost:8000/api/users?project_id=${projectId}`,{headers:{"Cache-Control":"no-store"}}).then(r=>r.json()),
    ]).then(([t,u])=>{setTasks(t);setUsers(u);setLoading(false);}).catch(()=>setLoading(false));
  };
  useEffect(()=>{loadData();},[projectId]);

  const handleCreateUser=async()=>{
    if(!newName.trim()) return toast.error("Name required");
    if(!/\S+@\S+\.\S+/.test(newEmail)) return toast.error("Valid email required");
    setCreating(true);
    try {
      const res=await fetch("http://localhost:8000/api/users",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:newName.trim(),email:newEmail.trim(),role:newRole,department:newDept,project_id:Number(projectId)}),
      });
      if(res.ok){const u=await res.json();setUsers(prev=>[...prev,u]);setNewName("");setNewEmail("");setNewRole("member");setNewDept("");setShowAddUser(false);toast.success(`${u.name} added!`);}
      else{const e=await res.json();toast.error(e.message||"Failed");}
    }catch{toast.error("Failed");} finally{setCreating(false);}
  };
  const handleUpdateUser=async(updated)=>{
    try{const res=await fetch(`http://localhost:8000/api/users/${updated.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)});
      if(res.ok){const u=await res.json();setUsers(prev=>prev.map(x=>x.id===u.id?u:x));setEditUser(null);toast.success(`${u.name} updated!`);}
      else toast.error("Failed");}catch{toast.error("Failed");}
  };
  const handleDeleteUser=async(id)=>{
    try{const res=await fetch(`http://localhost:8000/api/users/${id}`,{method:"DELETE"});
      if(res.ok){setUsers(prev=>prev.filter(u=>u.id!==id));setEditUser(null);toast.success("Removed");}
      else toast.error("Failed");}catch{toast.error("Failed");}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>;

  const now=new Date();
  const sevenAgo=new Date(now-7*86400000);
  const sevenAhead=new Date(now.getTime()+7*86400000);
  const completed=tasks.filter(t=>t.status==="done"&&new Date(t.updatedAt)>=sevenAgo).length;
  const updated=tasks.filter(t=>new Date(t.updatedAt)>=sevenAgo).length;
  const created=tasks.filter(t=>new Date(t.createdAt)>=sevenAgo).length;
  const dueSoon=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)<=sevenAhead&&new Date(t.dueDate)>=now&&t.status!=="done").length;

  const statusCounts=Object.keys(STATUS_COLORS).reduce((a,s)=>({...a,[s]:tasks.filter(t=>t.status===s).length}),{});
  const total=tasks.length;
  const radius=60,circ=2*Math.PI*radius;
  let off=0;
  const segments=Object.entries(statusCounts).map(([key,count])=>{
    const dash=total>0?(count/total)*circ:0;
    const seg={key,count,color:STATUS_COLORS[key].color,dash,offset:off}; off+=dash; return seg;
  });
  const recent=[...tasks].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,8);
  const timeAgo=(date)=>{const d=Math.floor((now-new Date(date))/1000);if(d<60)return"just now";if(d<3600)return`${Math.floor(d/60)}m ago`;if(d<86400)return`${Math.floor(d/3600)}h ago`;return`${Math.floor(d/86400)}d ago`;};
  const priCounts=["High","Medium","Low"].map(p=>({label:p,count:tasks.filter(t=>t.priority===p).length,color:PRIORITY_COLORS[p]}));
  const maxPri=Math.max(...priCounts.map(p=>p.count),1);

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-full">
      <Toaster position="top-right"/>
      {editUser&&<UserModal user={editUser} tasks={tasks} onClose={()=>setEditUser(null)} onUpdate={handleUpdateUser} onDelete={handleDeleteUser}/>}

      <div><h1 className="text-xl font-bold text-gray-800 dark:text-white">Summary</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your project activity</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[{icon:"✅",value:completed,label:"Completed",sub:"last 7 days",color:"text-green-600",bg:"bg-green-50"},
          {icon:"✏️",value:updated,label:"Updated",sub:"last 7 days",color:"text-blue-600",bg:"bg-blue-50"},
          {icon:"📋",value:created,label:"Created",sub:"last 7 days",color:"text-purple-600",bg:"bg-purple-50"},
          {icon:"⏰",value:dueSoon,label:"Due soon",sub:"next 7 days",color:"text-orange-600",bg:"bg-orange-50"},
        ].map(s=>(
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.label}</p>
              <p className="text-[10px] text-gray-400">{s.sub}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Status overview</h2>
          <p className="text-xs text-gray-400 mb-4">All work items by status</p>
          <div className="flex items-center gap-6">
            <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
              {total===0?<circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22"/>
                :segments.map(s=><circle key={s.key} cx="80" cy="80" r={radius} fill="none" stroke={s.color} strokeWidth="22"
                  strokeDasharray={`${s.dash} ${circ-s.dash}`} strokeDashoffset={-s.offset+circ*0.25}/>)}
              <text x="80" y="76" textAnchor="middle" style={{fontSize:24,fontWeight:700,fill:"#1f2937"}}>{total}</text>
              <text x="80" y="94" textAnchor="middle" style={{fontSize:10,fill:"#9ca3af"}}>Total issues</text>
            </svg>
            <div className="space-y-2.5 flex-1">
              {Object.entries(STATUS_COLORS).map(([k,v])=>{const cnt=statusCounts[k];const pct=total>0?Math.round((cnt/total)*100):0;return(
                <div key={k} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:v.color}}/>
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{v.label}</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-white">{cnt}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                </div>);})}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Recent activity</h2>
          <p className="text-xs text-gray-400 mb-4">Latest updates</p>
          <div className="space-y-3 overflow-y-auto max-h-52">
            {recent.length===0&&<p className="text-xs text-gray-400 italic">No activity yet</p>}
            {recent.map(task=>{const a=task.user?.name||"Unassigned";const cfg=STATUS_COLORS[task.status];return(
              <div key={task.id} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5" style={{background:stringToColor(a)}}>{a[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300"><span className="font-semibold">{a}</span>{" · "}<span className="text-gray-500">{task.title}</span></p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{background:cfg?.color+"22",color:cfg?.color}}>{cfg?.label}</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(task.updatedAt)}</span>
                  </div>
                </div>
              </div>);})}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Priority breakdown</h2>
        <p className="text-xs text-gray-400 mb-5">Distribution by priority</p>
        <div className="space-y-3">
          {priCounts.map(({label,count,color})=>(
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-16">{label}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-500" style={{width:`${(count/maxPri)*100}%`,background:color}}/>
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div><h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">Team Members</h3>
              <p className="text-[10px] text-gray-400">{users.length} member{users.length!==1?"s":""} · Double-click to edit</p></div>
            <button onClick={()=>setShowAddUser(!showAddUser)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showAddUser?"bg-gray-100 text-gray-600":"bg-blue-600 hover:bg-blue-700 text-white"}`}>
              {showAddUser?"✕ Cancel":"+ Add Member"}
            </button>
          </div>

          {showAddUser&&(
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-bold text-blue-700 mb-3">New Team Member</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Name *</label>
                  <input type="text" placeholder="e.g. Priya Sharma" value={newName} onChange={e=>setNewName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 bg-white"/></div>
                <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email *</label>
                  <input type="email" placeholder="e.g. priya@example.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 bg-white"/></div>
                <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Role</label>
                  <div className="flex gap-1.5">{ROLES.map(r=>(
                    <button key={r} onClick={()=>setNewRole(r)} className={`flex-1 py-2 rounded-lg border text-[10px] font-semibold capitalize transition-all ${newRole===r?"bg-blue-600 text-white border-blue-600":"bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>{r}</button>
                  ))}</div></div>
                <div><label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Department</label>
                  <select value={newDept} onChange={e=>setNewDept(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="">Select...</option>
                    <optgroup label="── Engineering ──">{DEPARTMENTS.slice(0,10).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
                    <optgroup label="── Product & Design ──">{DEPARTMENTS.slice(10,15).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
                    <optgroup label="── Data & AI ──">{DEPARTMENTS.slice(15,21).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
                    <optgroup label="── Business ──">{DEPARTMENTS.slice(21,28).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
                    <optgroup label="── Other ──">{DEPARTMENTS.slice(28).map(d=><option key={d} value={d}>{d}</option>)}</optgroup>
                  </select></div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleCreateUser} disabled={creating} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {creating?<><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Adding...</>:"Add to Team"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {users.length===0&&<p className="text-xs text-gray-400 italic">No members yet. Add one above!</p>}
            {users.map(user=>{
              const ut=tasks.filter(t=>t.user_id===user.id);
              const dp=ut.length>0?Math.round((ut.filter(t=>t.status==="done").length/ut.length)*100):0;
              const rc=ROLE_STYLE[user.role]||ROLE_STYLE.member;
              return(
                <div key={user.id} onDoubleClick={()=>setEditUser(user)} title="Double-click to edit"
                  className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl px-4 py-3 min-w-[220px] cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{background:stringToColor(user.name)}}>{user.name[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border capitalize ${rc.bg} ${rc.text} ${rc.border}`}>{user.role}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    {user.department&&<p className="text-[10px] text-blue-500 truncate font-medium">{user.department}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{width:`${dp}%`,background:stringToColor(user.name)}}/>
                      </div>
                      <span className="text-[9px] text-gray-400 whitespace-nowrap">{ut.length} tasks · {dp}%</span>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 text-xs transition-colors opacity-0 group-hover:opacity-100">✏️</span>
                </div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}