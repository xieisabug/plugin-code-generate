import './index.css'
import fs from 'fs'

export default class SamplePlugin implements TeaPlugin, TeaAssistantTypePlugin {
	prompt: string = `
	按照以下格式进行代码生成：
	@f-start:/path/to/data
	your generate code here
	@f-end
	
	格式额外要求：
	- 生成的path包含对应的文件名
	- 生成的文件内容需要包含文件的全部内容，不要省略

	以下是对生成代码的要求：
	`;
	answer: string = '';

	config(): Config {
		return {
			name: '代码生成',
			type: ['assistantType']
		}
	}

	onPluginLoad(_: SystemApi) {
		console.log('SamplePlugin init')
	}

	onAssistantTypeInit(assistantTypeApi: AssistantTypeApi): void {
		assistantTypeApi.typeRegist(1, "代码生成助手", this);
	}

	onAssistantTypeSelect(assistantTypeApi: AssistantTypeApi) {
		assistantTypeApi.changeFieldLabel('prompt', "遵循要求");
		assistantTypeApi.addFieldTips('prompt', "内置生成文件内容格式和自动创建文件的命令，请勿修改模型输出遵循的格式，请指定生产");
		assistantTypeApi.addField('fileScanDirectory', '文件扫描目录', 'input', {
			required: true
		});
		assistantTypeApi.addField('confirmBeforeGenerate', '生成前确认', 'checkbox', {
			required: true
		});
	}

	onAssistantTypeRun(assistantRunApi: AssistantRunApi) {
		this.answer = '';
		const newSystemApi = this.prompt + assistantRunApi.getField('prompt');
		assistantRunApi.askAssistant(assistantRunApi.getUserInput(), assistantRunApi.getAssistantId(), undefined, undefined, undefined, (payload: string, aiResponse: AiResponse, responseIsResponsingFunction: (isFinish : boolean) => void) => {
			assistantRunApi.setAiResponse(aiResponse.add_message_id, '@tips-loading:正在生成对应文件');
			if (payload !== "Tea::Event::MessageFinish") {
				// 更新messages的最后一个对象
				this.answer = payload;
			} else {
				// 提取多段f-start和f-end之间的内容
				const fileContents = this.answer.match(/@f-start:([\s\S]*?)@f-end/g);
				if (fileContents) {
					for (const fileContent of fileContents) {
						const [filePath, content] = fileContent.split(':').map((str: string) => str.trim());
						fs.writeFileSync(filePath, content);
					}
				}
				assistantRunApi.setAiResponse(aiResponse.add_message_id, '@tips-success:生成完成');
				responseIsResponsingFunction(false);
			}
			
		});
	}
}