import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Button,
    Checkbox,
    Input,
    Link,
} from "@nextui-org/react";
    

export const Form =()=>{
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return(
        <div className="Form">
            <div className="Form-Button">
              <Button 
              color="primary"
              variant="shadow"
              onPress={onOpen}
              >
                Придбати
              </Button>
              <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Log in</ModalHeader>
              <ModalBody>
              <Input
                isRequired
                placeholder="Ваше ім'я"
                label = "Ім'я"
              />
              <Input
                isRequired
                label="Номер телефону"
                defaultValue="+380"
              />
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  variant="bordered"
                />
                <Input
                  isRequired
                  label="Кількість місць"
                  defaultValue="1"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Відмінити
                </Button>
                <Button color="primary" onPress={onClose}>
                  Підтвердити
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
          </div>
        </div>
    );

}