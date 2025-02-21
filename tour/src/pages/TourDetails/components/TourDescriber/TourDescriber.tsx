import {Tabs, Tab, Card, CardBody} from "@heroui/react";

interface Tour{
    
}

export const TourDescriber =()=>{
    let desc = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    
    return(
        <div className="TourDescriber">
            <div className="flex w-full flex-col">
                <div className="TourDescriber-descr">
                    <h2>Опис</h2>
                </div>
            </div>
        </div>
    );
}