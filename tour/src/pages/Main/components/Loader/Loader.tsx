import {CircularProgress} from "@heroui/react";
import './Loader.scss';
export const Loader = ()=>{
    return (
        <div className='loader-container'>
        <CircularProgress className='loader' color='primary' aria-label='Loading...' size='md'/>
        </div> 
    );
}