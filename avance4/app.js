// Avance 4 - app.js (usa localStorage)
const LS_USERS = 'cancha_users';
const LS_HORARIOS = 'cancha_horarios';
const LS_RESERVAS = 'cancha_reservas';
let currentUser = null;

// Helpers LS
const load = (k)=> JSON.parse(localStorage.getItem(k) || '[]');
const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

// Init with sample horarios if empty
function initHorarios(){
  let h = load(LS_HORARIOS);
  if(h.length===0){
    const today = new Date();
    const addDay = (d, offset)=> {
      const dd = new Date(d); dd.setDate(dd.getDate()+offset);
      return dd.toISOString().slice(0,10);
    };
    h = [
      {id:1, fecha: addDay(today,0), hora:'18:00', estado:'disponible'},
      {id:2, fecha: addDay(today,0), hora:'20:00', estado:'disponible'},
      {id:3, fecha: addDay(today,1), hora:'19:00', estado:'disponible'},
      {id:4, fecha: addDay(today,2), hora:'21:00', estado:'disponible'}
    ];
    save(LS_HORARIOS,h);
  }
}
initHorarios();

// UI elements
const regNombre = document.getElementById('regNombre');
const regTelefono = document.getElementById('regTelefono');
const regEmail = document.getElementById('regEmail');
const regPass = document.getElementById('regPass');
const btnRegister = document.getElementById('btnRegister');
const btnLogin = document.getElementById('btnLogin');
const loginEmail = document.getElementById('loginEmail');
const loginPass = document.getElementById('loginPass');

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const horariosList = document.getElementById('horariosList');
const misReservas = document.getElementById('misReservas');
const userInfo = document.getElementById('userInfo');
const btnLogout = document.getElementById('btnLogout');

const adminBox = document.getElementById('adminBox');
const newFecha = document.getElementById('newFecha');
const newHora = document.getElementById('newHora');
const btnAddHorario = document.getElementById('btnAddHorario');

btnRegister.onclick = ()=>{
  const users = load(LS_USERS);
  const email = (regEmail.value||'').trim().toLowerCase();
  if(!email || !regPass.value || !regNombre.value){ alert('Completá todos los campos'); return; }
  if(users.find(u=>u.email===email)){ alert('El correo ya está registrado'); return; }
  const id = Date.now();
  users.push({id, nombre: regNombre.value.trim(), telefono: regTelefono.value.trim(), email, pass: regPass.value});
  save(LS_USERS,users);
  alert('Registro exitoso. Iniciá sesión.');
  regNombre.value='';regTelefono.value='';regEmail.value='';regPass.value='';
};

btnLogin.onclick = ()=>{
  const users = load(LS_USERS);
  const email = (loginEmail.value||'').trim().toLowerCase();
  const pass = loginPass.value || '';
  const u = users.find(x=>x.email===email && x.pass===pass);
  if(!u){ alert('Usuario o contraseña incorrecta'); return; }
  currentUser = u;
  loginEmail.value=''; loginPass.value='';
  showApp();
};

function showApp(){
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  userInfo.innerText = `Usuario: ${currentUser.nombre} (${currentUser.email})`;
  // admin flag: if email contains "admin" (simple)
  if(currentUser.email.includes('admin')) adminBox.classList.remove('hidden');
  renderHorarios();
  renderReservas();
}

btnLogout.onclick = ()=>{
  currentUser = null;
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  userInfo.innerText = '';
};

// render horarios
function renderHorarios(){
  const h = load(LS_HORARIOS).sort((a,b)=> (a.fecha+b.hora).localeCompare(b.fecha+a.hora));
  horariosList.innerHTML = '';
  h.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'horario';
    div.innerHTML = `<div>${item.fecha} — ${item.hora}</div><div class="estado">${item.estado}</div>`;
    if(item.estado==='disponible' && currentUser){
      const btn = document.createElement('button');
      btn.textContent = 'Reservar';
      btn.className = 'reserveBtn';
      btn.onclick = ()=> makeReserva(item.id);
      div.appendChild(btn);
    }
    horariosList.appendChild(div);
  });
}

function makeReserva(idHorario){
  if(!currentUser){ alert('Iniciá sesión para reservar'); return; }
  let h = load(LS_HORARIOS);
  const found = h.find(x=>x.id===idHorario);
  if(!found || found.estado!=='disponible'){ alert('Horario no disponible'); renderHorarios(); return; }
  // crear reserva
  const reservas = load(LS_RESERVAS);
  const id = Date.now();
  reservas.push({id, id_usuario: currentUser.id, id_horario: idHorario, fecha_reserva: new Date().toISOString(), estado:'activa'});
  save(LS_RESERVAS,reservas);
  // marcar horario ocupado
  found.estado='ocupado';
  save(LS_HORARIOS,h);
  alert('Reserva confirmada');
  renderHorarios();
  renderReservas();
}

function renderReservas(){
  const reservas = load(LS_RESERVAS).filter(r=> currentUser && r.id_usuario===currentUser.id);
  misReservas.innerHTML = '';
  if(reservas.length===0){ misReservas.innerHTML = '<em>No tenés reservas</em>'; return; }
  const h = load(LS_HORARIOS);
  reservas.forEach(r=>{
    const horario = h.find(x=>x.id===r.id_horario) || {fecha:'-', hora:'-'};
    const div = document.createElement('div');
    div.className = 'horario';
    div.innerHTML = `<div>${horario.fecha} — ${horario.hora}  (${r.estado})</div>`;
    if(r.estado==='activa'){
      const btn = document.createElement('button');
      btn.textContent = 'Cancelar';
      btn.className = 'cancelBtn';
      btn.onclick = ()=> cancelReserva(r.id);
      div.appendChild(btn);
    }
    misReservas.appendChild(div);
  });
}

function cancelReserva(idReserva){
  if(!confirm('Confirmar cancelación')) return;
  const reservas = load(LS_RESERVAS);
  const idx = reservas.findIndex(r=>r.id===idReserva);
  if(idx===-1) return;
  const r = reservas[idx];
  r.estado='cancelada';
  save(LS_RESERVAS,reservas);
  // liberar horario
  const horarios = load(LS_HORARIOS);
  const h = horarios.find(x=>x.id===r.id_horario);
  if(h) h.estado='disponible';
  save(LS_HORARIOS,horarios);
  alert('Reserva cancelada');
  renderHorarios();
  renderReservas();
}

// Admin: agregar horario
btnAddHorario.onclick = ()=>{
  const f = newFecha.value;
  const hr = newHora.value.trim();
  if(!f || !hr){ alert('Complete fecha y hora'); return; }
  const horarios = load(LS_HORARIOS);
  const id = Date.now();
  horarios.push({id, fecha:f, hora:hr, estado:'disponible'});
  save(LS_HORARIOS,horarios);
  alert('Horario agregado');
  newFecha.value=''; newHora.value='';
  renderHorarios();
};

// On load: if there is a single registered user, don't auto-login; show auth.
(function onLoad(){
  renderHorarios();
})();
