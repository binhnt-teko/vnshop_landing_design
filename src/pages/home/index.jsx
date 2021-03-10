import React from 'react';

function List(props) {
    return <h1>Hello {props.match.params.username}!</h1>;
}


export default List