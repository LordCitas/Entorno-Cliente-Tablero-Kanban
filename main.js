//Una clave única para buscar los datos del tablero en localStorage
const DATOS_GUARDADOS = 'tablero_kanban';

//Definimos un objeto para llevar el estado del tablero en la sesión actual
let estado = {
    configuracion: null, //{ columns: [{id, titulo, limite}] }
    tareas: []     //[{id, columnId, content}]
};

//Lo primero que debemos hacer es cargar el estado guardado si existe
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    mostrarInfo();
});

//Una función para cargar el estado que haya guardado en localStorage
function cargarEstado(){
    //Accedemos a la dirección de localStorage donde deben estar los datos guardados
    const guardado = localStorage.getItem(DATOS_GUARDADOS);

    //Si hay un estado guardado, lo parseamos y se lo asignamos al estado de la sesión actual
    if(guardado){
        estado = JSON.parse(guardado);
    }
}

//Una función para guardar el estado que haya guardado en localStorage
function guardarEstado(){
    localStorage.setItem(DATOS_GUARDADOS, JSON.stringify(estado));
}

//Una función para mostrar la vista adecuada según el estado actual de la sesión
function mostrarInfo(){
    //Primero, limpiamos el contenido actual se esté mostrando en pantalla
    const contenido = document.getElementById('contenido');
    contenido.innerHTML = '';

    //Si no hay una configuración guardada o no hay columnas definidas, mostramos el formulario de configuración
    if(!estado.configuracion || estado.configuracion.columns.length === 0){
        mostrarFormulario(contenido);
    } else { //En caso contrario, mostramos el tablero kanban
        mostrarKanban(contenido);
    }
}

//Una función para generar y mostrar el formulario de configuración de forma dinámica
function mostrarFormulario(contenedor){
    //Generamos el título y lo añadimos al DOM
    const titulo = document.createElement('h1');
    titulo.textContent = "Configuración del Tablero Kanban";
    contenedor.appendChild(titulo);

    //Generamos la tarjeta que pide el número de columnas (y le damos su clase para los estilos)
    const tarjeta = document.createElement('div');
    tarjeta.className = "tarjeta";
    
    //Definimos el HTML que contendrá la tarjeta
    const HTML_NUM_COLS = `
        <div id="step1" style="margin-bottom: 2rem;">
            <label for="numColumns">¿Cuántas columnas necesita tu tablero Kanban?</label>
            <div class="flex-group">
                <input type="number" id="numColumns" min="1" max="10" value="3" placeholder="3">
                <button id="botonConfigCols" class="btn-primary">Generar Campos</button>
            </div>
        </div>
        <div id="contenedorConfigCols"></div>
        <div id="contenedorBotonCrearKanban" style="display: none;">
            <button id="botonCrearKanban" class="btn-success">Crear Tablero</button>
        </div>
    `;

    //Insertamos el html en la tarjeta y la insertamos en el contenedor del DOM
    tarjeta.innerHTML = HTML_NUM_COLS;
    contenedor.appendChild(tarjeta);

    //Accedemos a los elementos del DOM que vamos a hacer dinámicos
    const botonConfigCols = document.getElementById('botonConfigCols');
    const contenedorConfigCols = document.getElementById('contenedorConfigCols');
    const contenedorBotonCrearKanban = document.getElementById('contenedorBotonCrearKanban');
    const botonCrearKanban = document.getElementById('botonCrearKanban');

    //Un listener para generar los campos de configuración de las columnas
    botonConfigCols.addEventListener('click', () => {
        //Tomamos y parseamos el valor del input
        const num = parseInt(document.getElementById('numColumns').value);

        //Lanzamos un aviso si el número no es válido
        if (num < 1) {
            showToast("Debe haber por lo menos una columna. Por favor, introduce un número válido.", "error");
            return;
        }

        //Una vez validado, vaciamos el contenedor
        contenedorConfigCols.innerHTML = '';
        
        //Vamos con el bucle que genera una tarjeta con campos del formulario para definir cada columna
        for(let i = 0; i < num; i++){
            //Generamos el div contenedor de la columna y añadimos los campos y clases necesarios
            const columna = document.createElement('div');
            columna.className = "config-columna";
            columna.innerHTML = `
                <div class="flex-1">
                    <label>Nombre columna ${i + 1}</label>
                    <input type="text" class="nombreColumna" placeholder="Ej: Pendiente" required>
                </div>
                <div class="w-30">
                    <label>Límite</label>
                    <input type="number" class="longitudColumna" placeholder="Sin límite" min="0">
                </div>
            `;

            //Añadimos la columna al DOM dentro del formulario
            contenedorConfigCols.appendChild(columna);
        }

        //Revelamos el botón de validación del formulario para permitir la creación del tablero
        contenedorBotonCrearKanban.style.display = 'block';
    });

    //Un listener para crear el tablero kanban con la configuración que se ha definido
    botonCrearKanban.addEventListener('click', () => {
        //Seleccionamos todos los valores de los inputs del formulario
        const nombresCols = document.querySelectorAll('.nombreColumna');
        const longitudCols = document.querySelectorAll('.longitudColumna');

        //Definimos un array para las nuevas columnas y una variable de validación
        const columnasNuevas = [];
        let esValido = true;

        //Definimos un contador para asignar IDs únicos a las columnas
        let contador = 0;

        //Vamos con un bucle para recoger y validar los datos de cada columna
        nombresCols.forEach((input, index) => {
            //Limpiamos y recogemos los valores
            const nombre = input.value.trim();
            const valorLimite = longitudCols[index].value;
            // Si está vacío o es menor/igual a 0, asignamos null. Si no, el número.
            const limite = (valorLimite === '' || parseInt(valorLimite) <= 0) ? null : parseInt(valorLimite);

            //Si la columna no tiene nombre, marcamos un error
            if(!nombre){
                esValido = false;
                input.classList.add('error');
            } else { //En caso contrario, añadimos la columna al array de nuevas columnas
                //Quitamos cualquier marca de error previa
                input.classList.remove('error');

                //Añadimos la columna al array
                columnasNuevas.push({
                    id: contador++,
                    titulo: nombre,
                    limite: limite
                });
            }
        });

        //Si hay algún error de validación, mostramos un aviso y salimos
        if (!esValido) {
            showToast("Por favor, asigna un nombre a todas las columnas.", "error");
            return;
        }

        //Si no ha habido ningún error, guardamos la nueva configuración en el estado y reiniciamos las tareas
        estado.configuracion = {columns: columnasNuevas};
        estado.tareas = [];

        //Guardamos en localStorage y mostramos el tablero kanban
        guardarEstado();
        mostrarInfo();
    });
}

//Una fun ción para generar y mostrar el tablero kanban de forma dinámica
function mostrarKanban(contenedor){
    //Generamos un header para el tablero con botón de reseteo de la configuración
    const header = document.createElement('header');
    header.className = "board-header";
    header.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">Mi Tablero Kanban</div>
        <button id="btnReset" class="btn-reset">Reiniciar configuración</button>
    `;

    //Lo añadimos al DOM
    contenedor.appendChild(header);

    //Un listener para el botón de reseteo de la configuración
    document.getElementById('btnReset').addEventListener('click', () => {
        //Antes de resetear, pedimos una confirmación al usuario
        if(confirm("¿Estás seguro? Se borrarán todas las tareas y la configuración.")){
            localStorage.removeItem(DATOS_GUARDADOS);
            estado = {configuracion: null, tareas: []};
            mostrarInfo();
        }
    });

    //Generamos un contenedor para el tablero, le damos las clases para estilos y lo añadimos al DOM
    const tablero = document.createElement('div');
    tablero.className = "board-container custom-scrollbar";
    contenedor.appendChild(tablero);

    //Vamos con el buvcle que genera cada columna del tablero y sus tareas
    estado.configuracion.columns.forEach(column => {
        //Seleccionamos las tareas que le pertenecen a esta columna y comprobamos si ha alcanzado su límite
        const tareasColumna = estado.tareas.filter(t => t.columnId === column.id);
        const estaLlena = column.limite !== null && tareasColumna.length >= column.limite;

        //Creamos el elemento de la columna y le asignamos sus clases y atributos de datos
        const colEl = document.createElement('div');
        colEl.className = `column ${estaLlena ? 'is-full' : ''}`;
        colEl.dataset.colId = column.id;
        colEl.dataset.limite = column.limite || 'Infinity';

        //Le añadimos un header con el título y el contador de tareas
        const colHeader = document.createElement('div');
        colHeader.className = "column-header";
        colHeader.innerHTML = `
            <span title="${column.titulo}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${column.titulo}</span>
            <span class="counter">
                ${tareasColumna.length} / ${column.limite === null ? '∞' : column.limite}
            </span>
        `;
        colEl.appendChild(colHeader);

        //Creamos el contenedor de las tareas de la columna y le damos estilos
        const taskList = document.createElement('div');
        taskList.className = "task-list custom-scrollbar";
        taskList.dataset.type = "task-list";
        
        // Renderizar tareas
        tareasColumna.forEach(task => {
            const taskEl = createTaskElement(task);
            taskList.appendChild(taskEl);
        });

        colEl.appendChild(taskList);

        // Pie de Columna (Añadir tarea)
        const colFooter = document.createElement('div');
        colFooter.className = "column-footer";
        
        if (estaLlena) {
            colFooter.innerHTML = `<div class="limit-msg">Límite alcanzado</div>`;
        } else {
            const inputGroup = document.createElement('div');
            inputGroup.className = "flex-group";
            inputGroup.innerHTML = `
                <input type="text" placeholder="Nueva tarea..." style="font-size: 0.9rem;">
                <button class="btn-icon">
                    +
                </button>
            `;
            
            // Lógica para añadir tarea
            const input = inputGroup.querySelector('input');
            const btn = inputGroup.querySelector('button');

            const addTaskAction = () => {
                const content = input.value.trim();
                if (!content) return;
                
                // Añadir tarea al estado
                estado.tareas.push({
                    id: `task-${Date.now()}`,
                    columnId: column.id,
                    content: content
                });
                guardarEstado();
                mostrarInfo(); // Re-renderizar todo para actualizar contadores y estados
            };

            btn.addEventListener('click', addTaskAction);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTaskAction();
            });

            colFooter.appendChild(inputGroup);
        }
        colEl.appendChild(colFooter);

        // Eventos de Drag & Drop en la COLUMNA (Dropzone)
        colEl.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necesario para permitir drop
            const limite = column.limite;
            const currentCount = estado.tareas.filter(t => t.columnId === column.id).length;
            
            if (limite === null || currentCount < limite) {
                colEl.classList.add('drag-over');
            }
        });

        colEl.addEventListener('dragleave', () => {
            colEl.classList.remove('drag-over');
        });

        colEl.addEventListener('drop', (e) => {
            e.preventDefault();
            colEl.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const taskIndex = estado.tareas.findIndex(t => t.id === taskId);
            
            if (taskIndex > -1) {
                const task = estado.tareas[taskIndex];
                
                if (task.columnId === column.id) return;

                const targetCount = estado.tareas.filter(t => t.columnId === column.id).length;
                if (column.limite !== null && targetCount >= column.limite) {
                    showToast("Esta columna ha alcanzado su límite máximo.", "error");
                    return;
                }

                // Actualizar estado
                task.columnId = column.id;
                guardarEstado();
                mostrarInfo();
            }
        });

        tablero.appendChild(colEl);
    });
}

// --- COMPONENTE TAREA ---

function createTaskElement(task) {
    const el = document.createElement('div');
    el.className = "task";
    el.draggable = true;
    el.textContent = task.content;
    el.title = "Doble clic para eliminar";

    // Eventos de Arrastre (Drag)
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => el.classList.add('dragging'), 0);
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
    });

    // Evento Eliminar (Doble Clic)
    el.addEventListener('dblclick', () => {
        estado.tareas = estado.tareas.filter(t => t.id !== task.id);
        guardarEstado();
        mostrarInfo();
    });

    // Icono de eliminar visible en hover
    const delIcon = document.createElement('span');
    delIcon.innerHTML = '&times;';
    delIcon.className = "task-delete";
    el.appendChild(delIcon);

    return el;
}

// --- UTILIDADES ---

function showToast(message, type = 'info') {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-info'}`;
    toast.textContent = message;
    
    contenedor.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}