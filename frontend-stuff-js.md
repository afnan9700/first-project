# frontend stuff js
## intro
So I was working on [that blog app project](first-project-log.md) and was having some hard time understand all of the frontend stuff. Everything sounds so vague and abstract, so much jargon, and I cant seem to understand anything about why anything works the way it does, the reason why all of it is designed the way it is and what not. Anyway, here's where i am going to write down what little i will make sense from making the project. All of this is also going be very vague and abstract, but frontend isnt my main concern, so I am not going to bother going too deep into all of it.
Also see [[fetch-api]]. It (or another framework called Axios) is what's used for communication between the backend and the frontend.

Also, I feel that this one is written a lot better than that log thing. So... Just saying, I might kinda suggest reading it a little. Like if you also happen to be confused with some react concept.

## React
React has something called "component-based architecture". What it means is that UI elements in react are modular reusable objects, and they are referred to as components. Each of these components maintains its own "state and props" (not sure what it is). Also, seems that initially, "class-based components" were primarily used in React. But they had some limitations, so they got (sort of) replaced by the new "function-based components". "Hooks" were what which made function-based components easy to use. 

A feature of react called the virtual DOM allows building "single page applications". A single page application can update the UI of an application whenever something changes without reloading the whole page. The virtual DOM is an in-memory copy of the original DOM. When the "state" of a component changes, the virtual DOM is somehow used to efficiently make changes to the real DOM.

In react, when a functional component gets re-rendered, the entire code inside the component gets executed again. This means, new instances of the variables, functions, objects, arrays and jsx in the code get created again, and the instances belonging to the previous render are discarded. But state variables, refs, memoized values and callbacks are exceptions, their instances persist across re-renders. And `useEffect()` behaves entirely in its own way based on the dependency array which has been passed to it (please remember this because it has caused me a lot of confusion). 
But what if an async function in a component is under execution when the re-render happens? Would the execution get discarded too? Seems that it does not (i think. im not sure). The async function and anything in it's closure would persist and execute in the background. And a new instance of the function would get created by the re-render. Seems that this kind of situation can lead to unintended behavior and cause problems (so we use that `isMounted` flag).

### useState
`useState()` is something called a "hook", and is very important in React.
Say you want to create a button in react which increments a variable "count" and displays the current count. 
You might do something like:
```jsx
let count = 0;
function MyButton() {
  function handleClick() {
    count = count + 1;
  }
  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
```
But it won't work. On clicking the button, the variable count will sure get incremented, but the displayed message won't change. This is because when you change the value of a variable using plain js, react wont know that something has changed (why? because thats just how react works). And remember that react re-renders anything only if it notices that something has changed. So we use `useState()`.
```jsx
function MyButton() {
  const [count, setCount] = useState(0);
  function handleClick() {
    setCount(count + 1);
  }
  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
```
useState returns a variable and function. And you must use only the function returned by useState to update the variable. Because only then will react know that it needs to re-render something. Also, the value passed to useState is the initial value of the variable.

There is an important thing to know when using states. It is that you must never set a state on a component that isn't mounted anymore. React components have a lifecycle where they are mounted, re-rendered, and finally unmounted. An unmounted component isn't part of React's DOM tree anymore, and calling `setState` is telling React to trigger a re-render of the component. But since the component was unmounted, React has nothing to re-render, and that would cause errors.

Also, notice how the `handleClick()` function is defined within the component. This is often done in react because such functions have direct access to the component's variables (like state). I am going to call them event handling functions here.

There's a small detail to note about useState. The state updates are performed asynchronously (for internal performance related reasons). It means that, react does not immediately update the state and re-renders the component after calling `setCount()`. It queues it somewhere and later calls it asynchronously.
```jsx
function Counter() {
	const [count, setCount] = useState(0); 
	const handleClick = () => { 
		setCount(count + 1); // Call 1 
		setCount(count + 1); // Call 2 
		setCount(count + 1); // Call 3 
		// At this point, you might expect count to be 3. But it will be 1
	}; 
	return ( 
		<div> <p>Count: {count}</p> 
			<button onClick={handleClick}>Increment 3 Times</button> 
		</div> 
	); 
}
```

Instead of the state's value, the function `setState()` can also a callback function as it's parameter. And that callback function takes a parameter which is often named `prev`. This `prev` value is just the value of current state. You may modify the current state using the callback function and set the new state.

Unrelated but, I also came across this new javascript "spreading" syntax when working with useState. 
```typescript
const arr1 = [1, 2];
const arr2 = [...arr1, 3]; // [1, 2, 3]. similar to arr1.push(3)
```
`...arr1` "unpacks" the elements of the previous array (or a js object), and all of that gets stored in the new array. You are essentially just copying the previous array into a new variable, and modifying it if needed. (Also, not sure, but I think spreading works a little differently if the current iterable contains another iterable. Look into it).
When working with `setState()`, you must never use `arr1.push()`. The reason is simple. React re-renders the component only when it detects a change in the state. If you did `setState(arr.push(3))`, there would be no difference in what's stored in `arr` and what gets passed to `setState()`, and hence no re-render would occur. So instead, prefer doing `setState((prev) => [...prev, 3])`.
### props
A component in react is a function that returns jsx. The jsx is what determines what should be rendered, and the rendered content can also change based on events (such as `onClick`). 

Components can be nested within other components. The nested components are called child components, and the component in which they get nested are called parent components. When it's said that React is a single-page application, what it means is it has only a single main template that gets updated (otherwise websites have a different template for each page). 

App.jsx is the main component that react renders. All other components get embedded within the App component. Typically, it contains something called React Router. React router handles what should get displayed  based on the URL.

When you've got a component that renders another component, you might want the parent component to determine state of a child component. This can be achieved by simply making the child component accept some data as parameters, and those parameters can be set by the parent component. That's exactly what react does, except those parameters are called "props". And instead of mentioning each parameter in the component function, you simply pass a `props` object, and define declare those parameters in the jsx using `{props.parameter_name}`.

Child component
```jsx
function Greeting(props) { 
	return ( <h2>Hello, {props.name}!</h2> ); 
}
```
Parent component
```jsx
function App() { 
	const [userName, setUserName] = useState("Alice"); 
	return ( 
		<div>
			<Greeting name={userName} />
			<button onClick={() => setUserName("Bob")}>Change Name</button> 
		</div> 
	); 
}
```

It is also possible that you might want a child component to call an event handling function which was defined in the parent component (when a child component triggers an event like `onClick`). This can also be achieved using props.
Instead of passing an event handling function directly to an event in the child component, we pass a parameter which will contain the actual event handling function. And the parent component will pass the actual event handling function to the parameter.

Child component
```jsx
function ChildButton(props) { 
	return ( 
		<button onClick={props.onClickFromParent}> {props.label} </button> 
	); 
}
```
Parent component
```jsx
function App() { 
	const [message, setMessage] = useState("No button clicked yet."); 
	const handleButtonClick = (buttonName) => { setMessage(`You clicked the ${buttonName} button!`); }; 
	return ( 
		<div> 
			<h1>Parent Component</h1> 
			<p>{message}</p>
			<ChildButton onClickFromParent={() => handleButtonClick("First")} label="Button One" />
			<ChildButton onClickFromParent={() => handleButtonClick("Second")} label="Button Two" /> 
		</div>
	); 
}
```

### context
Say you have the main app component, it contains a page, the page contains a card, the card contains some button and so on. It can get quite cumbersome when you need to pass a prop between external component to a deeply nested one, especially because the intermediate components may not even need the prop. 

React contexts are a way to share data between all components of a react tree without having to pass them through every component manually. 

The function `createContext()` returns a context object (and it also takes the default value of the context as a parameter). A context object has `Provider` and `Consumer` fields (though we don't actually use the `Consumer` field). The provider field accepts a prop called `value`. This prop is accessible by any children or sub-children of a component that wrapped by that context's provider tag (like `<SomeContext.Provider value=something>...</SomeContext.Provider>)`. Then, in the child components, you can use `useContext(SomeContext)` to access the prop `value`.

When the value of a context gets updated, all components that call `useContext(SomeContext)` get re-rendered.

Contexts are useful for handling information such as user authentication status, app theme, or any application wide settings.

To recall, just remember that
- `createContext()` returns a context object, say `SomeContext`. This object may seem useless by itself, but one of it's fields `SomeContext.Provider` is very important. It is essentially the JSX component which will store the "value" you want to be accessible to all child components wrapped by the context provider. 
- When working with typescirpt, you may come across code like
  `const SomeContext = createContext<SomeContextType | undefined>(undefined);`
  `createContext()` function takes the type of the value that will be stored in the context as a generic (`SomeContextType`). `undefined` if you don't provide a default value to the context.
- The values provided by contexts shouldn't have to be a variable or an object, contexts can provide functions too. And sometimes, those functions can alter a state, and that state change might trigger a re-render. Do note that, it is actually a function instance that gets passed as the "value". An implication of it is that any states defined in that function are the same across function calls made by the child components of the context. "But why would you do it? Aren't you still essentially just sharing a state across the child components? Why not pass the state directly?". I am not sure, but from how I understand it, the answer is just abstraction. When you are sure that a state is going to be modified in only a very specific way by any component, instead of passing the state and having to re-write that state modification inside every child component, you instead pass the modification itself, and because of how states and functions work, you would be essentially also sharing the state at the same time.
- You may also create a custom hook for `useContext`. It wraps the function call, and the error handling in a single function and simplifies `useContext` usage.
  ```typescript
	// src/context/useSome.ts
	import { useContext } from 'react';
	import { SomeContext } from './SomeContext';
	
	export const useSome = () => {
	  const context = useContext(SomeContext);
	  if (!context) throw new Error('useSome must be used within SomeContext.Provider');
	  return context;
	};
	```

> [!NOTE] check this out (typescript related stuff)
> There is a certain snippet from the code which can appear confusing because of our inexperience with typescirpt.
> ```typescript
> const AuthContext = createContext<AuthContextType | undefined>(undefined);
> export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  });
> ```
> `createContext` and many other functions in react use generics, and what you pass in those angular braces determines the type of value the context will store (what the type passed in a generic varies depends on the function's definition). 
> 
> In typescript, `React.FC` is the type defined for all react functional components. And functional components use props, so the generic used by `React.FC` represents the type of prop the functional component will store. I In the code, `AuthContext` is also a functional component (it returns the jsx containing the context's provider). I am not completely sure about `children: React.ReactNode` either, but heres what I think: `React.ReactNode` is the type of anything that react renders ("node" because its a part of the component tree). And the children components are passed as props to other components, and I think thats why `children: React.ReactNode` could be here. But I could be wrong. Because the child components are functional components too, so why isn't their type `React.FC` instead? Idk. Just remember that you will see that pattern a lot.

### useEffect
Functional components in React work the best when they behave as "pure functions". Meaning, a functional component should only handle the rendering of the component, and the updates of states and props, and nothing else. It is undesirable if your react component is altering anything outside its scope, stuff like making API calls, fetching data, time outs, intervals, subscribing to a websocket, or anything asynchronous especially. These kinds of interactions are called "side effects". 

If a functional component contains code that makes an API request and fetches some data, that request is going to be made every time React re-renders that component. This can cause issues with performance and may result in unpredictable behaviors. 

So we use `useEffect()`. 
```jsx
useEffect(() => {
  // Your side effect code here
  // This code runs after every render by default

  return () => {
    // Optional cleanup function
    // This runs before the component unmounts AND before the effect runs again
  };
}, [dependencies]); // Optional dependency array
```

Instead of writing the side effect code (such as a fetch request) directly in the functional component, it is passed as a callback function to `useEffect()`. The dependency array which is passed to `useEffect()` determines when React will execute the side effect code.
- When the dependency array isn't passed, side effect code is run every time the component gets rendered.
- When the dependency array is empty, side effect code is run after the component is mounted to the DOM for the first time.
- When specific dependencies are passed, side effect code is run after every time the dependency changes.

The function returned by the callback passed is called the Cleanup function. The cleanup function gets executed 
- When the component is unmounted from the DOM.
- Before running the side effect code again due to dependency changes.

Also, remember that the callback which is passed to `useEffect()` must not be an asynchronous function. `useEffect` expects the callback to either return a clean up function, or nothing. But an asynchronous function would return a promise, so that would cause errors. So, you also shouldn't  use `await` to call any async function inside the callback. Instead, you define a new async function inside the callback, call any external async functions you want to (such as `fetch`) using `await`, then call the defined async function inside the callback (simply call the function, don't store it in a variable).
```javascript
useEffect(() => {
  async function fetchData() {
    const response = await fetch('/api/data');
    const result = await response.json();
    setData(response);
  }
  fetchData();  // returns a Promise, but we ignore it
}, []);
```

Another thing to note while dealing with async functions inside a functional component is that the component may unmount before the async function finishes its execution. And you must never set state on unmounted components as it may lead to inconsistencies. So keep a track of whether a component is mounted, and set states carefully.
```javascript
useEffect(() => {
  let isMounted = true;
  async function fetchData() {
    const response = await fetch('/api/data');
    const result = await response.json();
    if (isMounted) setData(result);
  }
  fetchData();
  return () => {
    isMounted = false;
  };
}, []);
```
But the `isMounted` isn't completely fool proof either (i think). Using the clean up function as a way check mount isn't reliable when dependencies have been passed. Because the clean up function is called not only when the component is unmounted, but due to the dependency changes too. So the `isMounted` gets set to false before a re-render and would mess everything up? I thought so. But the side effect code runs again too, which means, `isMounted` gets set back to true again. So does that mean there are no problems then? I don't know, I came across someone say that "each side effect invocation gets its own isolated `isMounted` variable", so the `isMount` set to true by the re-render different from the `isMount` which became false due to dependency change. How does that affect anything now? I don't know. Which `isMount` would the async execution from the previous useState see? Idk. 
Idk anymore. There's also something called `AbortController`. Check it out if it feels like this is getting too convoluted.

### useRef


## Vite
Javascript applications are usually spread across multiple files (modules). However, browsers aren't optimized to load so many files at once to run an application. So **Bundlers** became a thing. A bundler reads code across all of the files and compresses everything into fewer files using various optimization techniques (minifying, tree shaking, transpiling etc.), and transforms the application such that it can be efficiently run in browsers. Some of the first traditional bundlers were Webpack and Parcel.

But a problem with the first bundlers was that they were slow. Every time a change was made in the application, the entire codebase would have to be bundled again. 
Vite solves the problem by not bundling the application during the development phase, and it uses a bundler called Rollup for the production build.

Seems that it acts as something called an "ESM-native dev server". And running `npm create vite@latest` is referred to as "starting a development server" I dont know why.
It helps you setup and scaffold your React project (how would you do it without Vite? and why is setting up a React project Vite's (which is a build tool) concern? it also "integrates with" tailwind css and a few other tools)

## Tailwind CSS
"its a utility-first framework".
idk what it means but heres what i think: i decided to not go too deep into it btw. i think that its something which abstracts away all of the tedious css styling. tailwind css probably converts code like `<div class="bg-blue-500 text-white p-4 rounded">` to actual css. a file called `tailwind.config.js` lets you customize more stuff about how tailwind will work.

## Shadcn UI, Material UI, Chakra UI etc.
They are called component libraries, and again, dont know much, but i am guessing they provide you pre-built and styled react components which you can quickly add to your application. thats it. the source code for those pre-built components might be in `components/ui`.


---
