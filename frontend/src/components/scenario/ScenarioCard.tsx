import {Scenario, ScenarioDialogOptions} from "./Types.tsx";
import {useNavigate} from "react-router-dom";

type Props = {
    scenario: Scenario
    showEditDialog: ( options: ScenarioDialogOptions ) => void
    showDeleteDialog: ( options: ScenarioDialogOptions ) => void
}

export default function ScenarioCard( props:Readonly<Props> ) {
    const navigate = useNavigate();

    function editScenario() {
        props.showEditDialog( {
            scenario: props.scenario
        });
    }

    function deleteScenario() {
        props.showDeleteDialog({
            scenario: props.scenario
        });
    }

    return (
        <div className={"ScenarioCard"}>
            <button className="ContentButton" onClick={()=>navigate("/scenario/"+props.scenario.id)}>
                <div className="ID">id: {props.scenario.id}</div>
                <div>label    : {props.scenario.label   }</div>
                <div>authorID : {props.scenario.authorID}</div>
            </button>
            <br/>
            <button onClick={editScenario}>Change Name</button>
            <button onClick={deleteScenario}>Delete</button>
        </div>
    )
}