import {Card, CardHeader, CardBody, Image} from "@nextui-org/react";
export const Cards =()=>{
      return(
        <Card className="py-4">
        <CardHeader >
        <p>Taiwan</p>
        <small className="text-default-500">12 Tracks</small>
        <h4 className="font-bold text-large">Frontend Radio</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          src="https://nextui.org/images/hero-card-complete.jpeg"
          width={270}
        />
      </CardBody>
        </Card>
      )  
};