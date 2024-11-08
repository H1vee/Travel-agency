import {Divider} from "@nextui-org/react";
import {Link} from "@nextui-org/react";
import './Footer.scss'
export const Footer =() =>{
    return(
      <div>
        <Divider/>
        <div className="Footer">
        <div className="Footer-Description">
          <h4 className="">OpenWorld</h4>
          <p className="Footer-Overview">Beautiful, fast and modern React UI library.</p>
        </div>
        
        <div className="Footer-Option">
          
          <div className="">
          <Link href="#" color="foreground" isBlock underline="hover" className="Footer-Main">
          Головна
          </Link>
          </div>

          <div className="">
            <Link href="#" color="foreground" isBlock underline="hover" className="Footer-AboutUs">
            Про Нас
            </Link>
          </div>

          <div className="">
            <Link href="#" color="foreground" isBlock underline="hover"className="Footer-Tours">
            Тури
            </Link>
          </div>
        </div>
      </div>
      </div>

    );
} 