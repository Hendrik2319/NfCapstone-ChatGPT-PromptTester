import {convertNewTestRunIntoDTO, NewTestRun, TestCase, TestRun, VariablesChangeMethod} from "../Types.tsx";
import styled from "styled-components";
import {SHOW_RENDERING_HINTS} from "../../../Types.tsx";
import axios from "axios";
import PromptEditAndView from "./PromptEditAndView.tsx";
import TestCasesEditAndView from "./TestCasesEditAndView.tsx";
import VariablesEdit from "./VariablesEdit.tsx";
import {loadCurrentNewTestRun, saveCurrentNewTestRun} from "./NewTestRunStoarage.tsx";

const Label = styled.label`
  margin-top: 0.5em;
  display: block;
`;

const BigButton = styled.button`
  font-size: 1.2em;
  font-weight: bold;
  padding: 0.5em 2em;
`;

function deepcopy(oldMap: TestCase): TestCase {
    const newMap = new Map<string, string[]>();
    oldMap.forEach(
        (value, key) => newMap.set(key, value.map(t => t)))
    return newMap;
}

function copyValues( scenarioId: string, data?: NewTestRun ) {
    if (data)
        return {
            prompt: data.prompt,
            scenarioId: scenarioId,
            variables: data.variables.map(str=>str),
            testcases: data.testcases.map(deepcopy)
        };
    return {
        prompt: "",
        scenarioId: scenarioId,
        variables: [],
        testcases: []
    };
}

type Props = {
    base?: TestRun
    scenarioId: string
    onSuccessfulTestRun: ()=>void
}

export default function NewTestRunPanel( props:Readonly<Props> ) {
    if (SHOW_RENDERING_HINTS) console.debug("Rendering NewTestRunPanel", { scenarioId: props.scenarioId });
    let usedVars = new Set<number>();
    let variablesCompGetter: null | (()=>string[]) = null;
    let    promptCompGetter: null | (()=>string) = null;
    let testcasesCompGetter: null | (()=>TestCase[]) = null;
    let    promptVarChangeNotifier: null | VariablesChangeMethod = null;
    let testcasesVarChangeNotifier: null | VariablesChangeMethod = null;

    let storedNewTestRun = loadCurrentNewTestRun(props.scenarioId) ?? copyValues(props.scenarioId, props.base);

    function getVariables(): string[]   { return !variablesCompGetter ? storedNewTestRun.variables : variablesCompGetter(); }
    function getPrompt   (): string     { return !   promptCompGetter ? storedNewTestRun.prompt    :    promptCompGetter(); }
    function getTestcases(): TestCase[] { return !testcasesCompGetter ? storedNewTestRun.testcases : testcasesCompGetter(); }

    function saveFormValues(prompt: string, variables: string[], testcases: TestCase[]) {
        storedNewTestRun = {
            prompt,
            scenarioId: props.scenarioId,
            variables,
            testcases
        };
        saveCurrentNewTestRun(props.scenarioId, storedNewTestRun)
    }

    function performTestRun() {
        const data = convertNewTestRunIntoDTO( {
            prompt: getPrompt(),
            scenarioId: props.scenarioId,
            variables: getVariables(),
            testcases: getTestcases()
        } );
        axios.post(`/api/testrun`, data)
            .then((response) => {
                if (response.status !== 200)
                    throw new Error(`Get wrong response status, when performing a test run: ${response.status}`);
                props.onSuccessfulTestRun();
            })
            .catch((error) => {
                console.error("ERROR[NewTestRunPanel.performTestRun]", error);
            })
    }

    function getVarColor(index: number): string {
        return "var(--text-background-var"+(index%6)+")";
    }

    function isAllowedToDeleteVar(varName: string): boolean {
        const testcases = getTestcases();
        const tc = testcases.find(testcase => {
            const values = testcase.get(varName);
            return values && values.length!==0;
        });
        if (tc) {
            alert("Can't delete variable.\r\nThere are at least 1 test case that have values for this variable.")
            return false;
        }
        return true;
    }

    const variablesChanged: VariablesChangeMethod = (index: number, oldVarName: string, newVarName: string): void => {
        if (promptVarChangeNotifier)
            promptVarChangeNotifier(index, oldVarName, newVarName);
        if (testcasesVarChangeNotifier)
            testcasesVarChangeNotifier(index, oldVarName, newVarName);
    }

    function onPromptChange( prompt: string ) {
        saveFormValues(prompt, storedNewTestRun.variables, storedNewTestRun.testcases)
    }

    function onVariablesChange( variables: string[] ) {
        saveFormValues(storedNewTestRun.prompt, variables, storedNewTestRun.testcases)
    }

    function onTestcasesChange( testcases: TestCase[] ) {
        saveFormValues(storedNewTestRun.prompt, storedNewTestRun.variables, testcases)
    }

    function cleanupTestcases(testcases: TestCase[], variables: string[]) {
        return testcases.map(testcase => {
            const cleanedTestcase: TestCase = new Map<string, string[]>();
            variables.forEach(varName => {
                const values = testcase.get(varName);
                cleanedTestcase.set(varName, !values ? [] : values.map(s => s));
            });
            return cleanedTestcase;
        });
    }

    return (
        <>
            <Label>Prompt :</Label>
            <PromptEditAndView
                prompt={storedNewTestRun.prompt}
                getVariables={getVariables}
                getVarColor={getVarColor}
                updateUsedVars={usedVars_ => usedVars = usedVars_}
                onPromptChange={onPromptChange}
                setGetter={fcn => promptCompGetter = fcn}
                setVarChangeNotifier={fcn => promptVarChangeNotifier = fcn}
            />
            <Label>Variables :</Label>
            <VariablesEdit
                variables={storedNewTestRun.variables}
                isAllowedToDelete={isAllowedToDeleteVar}
                getVarColor={getVarColor}
                notifyOthersAboutChange={variablesChanged}
                onVariablesChange={onVariablesChange}
                setGetter={fcn => variablesCompGetter = fcn}
            />
            <Label>Test Cases :</Label>
            <TestCasesEditAndView
                testcases={cleanupTestcases(storedNewTestRun.testcases, storedNewTestRun.variables)}
                getVariables={getVariables}
                getUsedVars={() => usedVars}
                getVarColor={getVarColor}
                onTestcasesChange={onTestcasesChange}
                setGetter={fcn => testcasesCompGetter = fcn}
                setVarChangeNotifier={fcn => testcasesVarChangeNotifier = fcn}
            />
            <BigButton onClick={performTestRun}>Start Test Run</BigButton>
        </>
    )
}