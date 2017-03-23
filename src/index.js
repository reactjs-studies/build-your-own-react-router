import React, { Component, PropTypes } from 'react';
import { render } from 'react-dom';

const $ = React.createElement;
const { bool, func, string } = PropTypes;

// ================
// ROUTER
// ================

let instances = [];

const register = (comp) => instances.push(comp);
const unregister = (comp) => instances.splice(instances.indexOf(comp), 1);

const historyPush = (path) => {
    history.pushState({}, null, path);
    instances.forEach(instance => instance.forceUpdate());
}

const historyReplace = (path) => {
    history.replaceState({}, null, path);
    instances.forEach(instance => instance.forceUpdate())
}

const matchPath = (pathname, options) => {
    const { exact = false, path } = options;

    if (!path) {
        return {
            path: null,
            url: pathname,
            isExact: true,
        }
    }

    const match = new RegExp(`^${path}`).exec(pathname);

    if (!match) {
        // There wasn't a match.
        return null
    }

    const url = match[0]
    const isExact = pathname === url

    if (exact && !isExact) {
        // There was a match, but it wasn't
        // an exact match as specified by
        // the exact prop.
        return null
    }

    return {
        path,
        url,
        isExact,
    }
};

class Route extends Component {

    componentWillMount() {
        addEventListener("popstate", this.handlePop);
        register(this);
    }

    componentWillUnmount() {
        unregister(this);
        removeEventListener("popstate", this.handlePop);
    }

    handlePop() {
        this.forceUpdate();
    }

    render() {

        const {
            path,
            exact,
            component,
            render,
        } = this.props;

        const match = matchPath(
            location.pathname, // global DOM variable
            { path, exact }
        );

        if (!match) {
            // Do nothing because the current
            // location doesn't match the path prop.

            return null
        }

        if (component) {
            // The component prop takes precedent over the
            // render method. If the current location matches
            // the path prop, create a new element passing in
            // match as the prop.

            return $(component, { match })
        }

        if (render) {
            // If there's a match but component
            // was undefined, invoke the render
            // prop passing in match as an argument.

            return render({ match })
        }

        return null
    }
};

Route.propTypes = {
    exact: bool,
    path: string,
    component: func,
    render: func,
};

class Link extends Component {

    handleClick(event) {

        const { replace, to } = this.props
        event.preventDefault()

        const historyAction = replace ? historyReplace : historyPush;
        historyAction(to);
    }

    render() {
        const { to, children } = this.props
        return (
            $('a', {
                href: to,
                onClick: this.handleClick.bind(this),
            }, children)
        )
    }
};

Link.propTypes = {
    to: string.isRequired,
    replace: bool,
};

class Redirect extends Component {

    componentDidMount() {
        const { to, push } = this.props

        const action = push ? historyPush : historyReplace;
        action(to);
    }

    render() {
        return null
    }
}

Redirect.propTypes = {
    to: string.isRequired,
    push: bool.isRequired
};


// ================
// COMPONENTS
// ================

const Home = () => $('h2', {}, 'Home');
const About = () => $('h2', {}, 'About');
const Topic = (label = '') => $('h3', {}, label);
const Topics = ({ match }) => {

    const links = [
        { label: 'Rendering with React', to: 'rendering-with-react' },
        { label: 'Components', to: 'components' },
        { label: 'Props vs State', to: 'props-vs-state' },
    ];

    const render = (value) => () => Topic(value);

    return (
        $('div', {},
            $('h2', {}, 'Topics'),

            links.map(
                (item) => (
                    $('li', { key: item.label },
                        $(Link, { to: `${match.url}/${item.to}` }, item.label)
                    )
                )
            ),

            links.map(
                (item) => (
                    $(Route, {
                        key: item.label,
                        path: `${match.url}/${item.to}`,
                        render: render(item.label)
                    })
                )
            ),

            $(Route, {
                path: match.url,
                exact: true,
                render: render('please select a topic')
            })
        )
    );
};

const App = ({ links = [] }) => (
    $('div', {},

        $(Route, {
            render: (props) => (
                $('pre', {}, `URL: ${JSON.stringify(props.match.url)}`)
            )
        }),

        $('ul', {},
            links.map((item) => (
                $('li', { key: item.label },
                    $(Link, { to: item.to }, item.label)
                )
            ))
        ),

        links.map((item) =>
            $(Route, {
                component: item.component,
                exact: item.exact,
                key: item.label,
                path: item.to,
            })
        )
    )
);

// ================
// App
// ================

const props = {
    links: [
        { exact: true, to: '/', label: 'Home', component: Home },
        { to: '/about', label: 'About', component: About },
        { to: '/topics', label: 'Topics', component: Topics }
    ]
};

render(App(props), window.document.getElementById('root'));
