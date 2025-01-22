// Drag & Drop Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

// Project Type
// Enum, that is accessed and modified with object syntax
enum ProjectStatus {
  Active,
  Finished,
}

// Will be used as a type
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// Project State Management
// Function type that specifies with a generic that
type Listener<T> = (items: T[]) => void;

// State Class that can be re-instantiated more than once
class State<T> {
  constructor() {}
  // Determines that the property "listeners" can be accessed only
  // by the State Class and its instances
  // Listeners must be an array of the same type of the generic indicated
  // when instantiating the class (see Project State)
  protected listeners: Listener<T>[] = [];
  // Pushes new listener function to the array
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

// The ProjectState class extends the State Class
// TS requires that the generic is declared, because
// it was required in the parent class
class ProjectState extends State<Project> {
  // projects property only accessible inside this class
  private projects: any[] = [];
  // Storing ProjectState instance in a variable ensures that this
  // class will be a singleton
  // Private makes sure it will only be accessed from inside this class
  // Static allows it to be accessed directly from the class, not the instance
  private static instance: ProjectState;
  // Private constructor
  private constructor() {
    super();
  }

  // Static method that creates or gets the already
  // created instance of the class
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  // Adds projects to the projects array. States the types of each parameter
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    // Calls updateListeners
    this.updateListeners();
  }

  // Function that requires the projectId and the newStatus
  moveProject(projectId: string, newStatus: ProjectStatus) {
    // Looks for the project being moved in the projects array
    const project = this.projects.find((prj) => prj.id === projectId);
    // If the project has a different status in the array, change it
    //  to the new one
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      // Calls updateListeners
      this.updateListeners();
    }
  }

  // Goes through all listeners in the listeners array
  // And pass down the projecs array, so all of the listeners
  // are "notified" when something changes
  updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

// Validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

//Types are defined in the function definition, and not when it is called
function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if (
    validatableInput.minLength &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid &&
      validatableInput.value.trim().length >= validatableInput.minLength;
  }

  if (
    validatableInput.maxLength &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid &&
      validatableInput.value.trim().length <= validatableInput.maxLength;
  }

  if (validatableInput.min && typeof validatableInput.value === "number") {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (validatableInput.max && typeof validatableInput.value === "number") {
    isValid = isValid && validatableInput.value >= validatableInput.max;
  }

  return isValid;
}

// Autobind Decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}

// Component Base Class. This class was created to centralize logic that will
// be used in different places. It defines 2 generic elements, that will be used somewhere
// inside that class. It means that whenever T ot U are called inside the component class,
// they have obey the type initially defined, since generics work as placeholders for types.
// In this case, they use type constraints, defining that both T and U need to extend the type
// HTMLElement.
// --
// T and U must be defined when extending the component class, as it will be seen further on on the code
// --
// The abstract keyword restricts the Component class of being
// instantiated itself. Only its children classes can be instantiated
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  // HTMLTemplate element, is available when the DOM lib is
  // defined on the tsconfig.json file
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  // The constructor function, defining the necessary paremeters.
  // And the optional parameters followed by the "?"
  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    // Gets the template element in the DOM through the id
    // The "!" tells TS that value will not be null
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;

    // Gets the exact place where the template tag will be placed
    // First use of the Generic, indicating that hostElement must obey the type
    // of T.
    this.hostElement = document.getElementById(hostElementId)! as T;

    // dom lib method that allows to import the segment of code that will be used
    // and extract its content from it
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    //U generic, will for all child components be the first element of the template element
    this.element = importedNode.firstElementChild as U;
    // Checks the use of the optional parameter. If there is a
    // newElementId, assigns it to the actual element being inserted
    if (newElementId) {
      this.element.id = newElementId;
    }

    // Calls the attach method passing the parameter received in the constructor
    this.attach(insertAtStart);
  }

  // Keyword private forbids access of this method from outside this class
  // insertAtBeggining must be of type boolean
  private attach(insertAtBeginning: boolean) {
    // DOM method called in an element to insert another element to it.
    // It requires the placement as first argument and what must be inserted
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  // Determines that configure and render content must be defined in the
  // children classes, with return type of void
  abstract configure(): void;
  abstract renderContent(): void;
}
// "Project Card in the list", extends the Component Class
// determining that hostElement will be of type HTMLUlListElement
// and HTMLLiElement. ProjectItem also implements the interface Draggable
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  // Private property that can only be accessed from inside the class,
  // of type "Project" which is a class
  private project: Project;

  // Getter to alternate text depending on how much people is on it
  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }

  // Class constructor that receives the hostId and the project itself
  constructor(hostId: string, project: Project) {
    // Calls Super, to access the Component's class constructor
    // Passing down as parameters templateId, hostId, false meaning that it
    // shouldn't be allocated in the beggining and the new element id
    super("single-project", hostId, false, project.id);
    // Assigns the project received as a parameter to the private project variable
    this.project = project;

    // Calls configure and render content
    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler(_: DragEvent): void {
    console.log("DragEnd");
  }

  // Configure adds eventListeners to the first child of the template element
  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }

  // Updates the text content of the project card based on the project received
  // The exclamation mark tells TS that the selected element will not be null
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned.";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// Project List Class
class ProjectList
  // Complying with the component class definition, ProjectList defines
  // The types of the generics it will use, obeying the Components class
  // generic restrictions. HTMLDivElement extends HTMLElement
  extends Component<HTMLDivElement, HTMLElement>
  // The class implements the DragTarget Interface
  implements DragTarget
{
  // Defines a variable of type array of Project Classes
  // It will ultimately be the projects of each list (active or finished)
  assignedProjects: Project[];

  // Class constructor function. This parameters syntax is a syntatic sugar
  // for immediately creating a private property called "type" with literal type value,
  // from the parameter received
  constructor(private type: "active" | "finished") {
    // Since this class inherists from another class, the super keyword refers
    // to the mother's class (Component) constructor, passing the necessary parameters
    super("project-list", "app", false, `${type}-projects`);

    // This is added to avoid typescript errors of not assigning anything to the variable
    this.assignedProjects = [];

    // Calls both methods when the class constructor function is called
    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      //The drop event will only be triggered if the dragOver element calls
      //event.preventDefault, because the default is for JS not to allow drag and drop
      // So in this case, event prevent default is necessary
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @autobind
  dragLeaveHandler(_: DragEvent): void {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  @autobind
  dropHandler(event: DragEvent): void {
    const prjId = event.dataTransfer!.getData("text/plain");
    projectState.moveProject(
      prjId,
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }

  // Method that renders each element in the list
  renderProjects() {
    // Gets the proper list using the type parameter received
    // in the class constructor, casting it as HTMLULListElement
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    ) as HTMLUListElement;
    // Clean up previous elements present in that list
    listEl.innerHTML = "";
    // Iterates on all elements in the assignedProjects Array
    for (const prjItem of this.assignedProjects) {
      // Instantiate a new Project item for each element,
      // passing the ul id and the element's info
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }

  // Filters which projects should be pushed to the instance
  // of this class
  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  // Method that renders the list element
  renderContent() {
    // Gets the type parameter in the constructor
    const listId = `${this.type}-projects-list`;
    // Assigns the listId to the ul element in the hostElement
    this.element.querySelector("ul")!.id = listId;
    // Assigns the following text to the h2 element in the hostElement
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
}

//Project Input Class
//Extends Component class, determining that the generic elements
//to be used inside are of types HTMLDivElement and HTMLFormElement,
//which extend the type HTMLElement, as contrained in the Component Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    //Inside the constructor, calls super to comply with
    //the Components constructor needs: the templateId, the hostId,
    // the template placement and the new element Id
    super("project-input", "app", true, "user-input");
    //Selects the inputs
    this.titleInputElement = this.element.querySelector(
      "#title"
    )! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    )! as HTMLInputElement;
    //Calls configure
    this.configure();
  }

  // Adds an event listener to the element. Element will
  // always be the first child of the imported node/template
  configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  // The Component class requires an implementation of renderContent
  // Since there is no utility in it here, this was declared this way
  renderContent() {}

  // Private method, meaning that it can only be used inside this class
  // Collects user inputs in the form that adds projects. It returns
  // a tuple, in case there are user inputs or else, nothing. A tuple is an array comprised of elements
  // of specific types.
  private gatherUserInput(): [string, string, number] | void {
    // Gets the elements values
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    // Objects that comply with the structural contract of validatable (through the interface)
    // to be used later in validation
    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
      minLength: 5,
      maxLength: 32,
    };

    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
      maxLength: 180,
    };

    const peopleValidatable: Validatable = {
      value: enteredPeople,
      required: true,
      min: 1,
      max: 999,
    };

    //Calling the validate function passing each user input
    // If validate returns false, the method only returns an alert
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid input, please try again!");
      return;
    }
    // If all inputs are validated, a tuple with the user inputs is returned
    else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  // Method only accessible inside the class, that clears all inputs
  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  // Callback to the form submisssion
  private submitHandler(event: Event) {
    // Prevents the page from reloading
    event.preventDefault();
    const userInput = this.gatherUserInput();
    // Checks if the return type is an array (in case there are no inputs, the function returns nothing)
    if (Array.isArray(userInput)) {
      // De-structures the tuple
      const [title, description, people] = userInput;
      // Calls the method addProject, passing the respective information
      projectState.addProject(title, description, people);

      // Calls clearInputs
      this.clearInputs();
    }
  }
}

const projInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
