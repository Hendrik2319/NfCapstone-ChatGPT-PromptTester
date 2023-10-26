import "./ScenarioList.css";
import {NewScenario, Scenario, UserInfos} from "../../Types.tsx";
import axios from "axios";
import {ChangeEvent, useEffect, useState} from "react";
import ScenarioCard from "./ScenarioCard.tsx";
import {createDialog} from "../FloatingDialogs.tsx";
import AddScenario from "./AddScenario.tsx";

type Props = {
    user: UserInfos
}

export default function ScenarioList( props:Readonly<Props> ) {
    const [ scenarios, setScenarios ] = useState<Scenario[]>([]);
    const [ showAll, setShowAll ] = useState<boolean>(false);
    const { user } = props;
    console.debug(`Rendering ScenarioList { scenarios: [${scenarios.length}] }`);

    useEffect(loadScenarios, [ showAll ]);

    function loadScenarios(){
        const url = showAll ? "/api/scenario/all" : "/api/scenario";
        axios.get(url)
            .then((response) => {
                if (response.status!==200)
                    throw new Error("Get wrong response status, when loading all scenario: "+response.status);
                setScenarios(response.data);
            })
            .catch((error)=>{
                console.error("Error in ScenarioList.loadScenarios():", error);
            })
    }

    function addScenario( label: string ) {
        const newScenario: NewScenario = { label };
        axios.post("/api/scenario", newScenario )
            .then((response) => {
                if (response.status!==200)
                    throw new Error("Get wrong response status, when adding a scenario: "+response.status);
                loadScenarios();
            })
            .catch((error)=>{
                console.error("Error in ScenarioList.addScenario():", error);
            })
    }

    const addDialog =
        createDialog<undefined>(
            'addScenarioDialog',
            dialogControl =>
                <AddScenario addScenario={addScenario} closeDialog={dialogControl.closeDialog}/>
        )

    function onShowAllChange( event: ChangeEvent<HTMLInputElement> ) {
        setShowAll( event.target.checked );
    }

    return (
        <>
            <h3>Scenarios</h3>
            {
                user.isAdmin &&
                <label><input type={"checkbox"} checked={showAll} onChange={onShowAllChange}/> of all users</label>
            }
            <div className={"ScenarioList"}>
                <button className={"ScenarioCard"} onClick={()=>addDialog.showDialog()}>Add</button>
                {
                    scenarios.map(scn => <ScenarioCard key={scn.id} scenario={scn}/>)
                }
            </div>
            {addDialog.writeHTML()}
        </>
    )
}