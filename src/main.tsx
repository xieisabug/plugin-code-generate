import "./index.css";
import { writeTextFile, createDir } from "@tauri-apps/api/fs";

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
  filePath: string = `\n生成代码的路径为: `;
  answer: string = "";

  config(): Config {
    return {
      name: "代码生成",
      type: ["assistantType"],
    };
  }

  onPluginLoad(_: SystemApi) {
    console.log("SamplePlugin init");
  }

  onAssistantTypeInit(assistantTypeApi: AssistantTypeApi): void {
    assistantTypeApi.typeRegist(1, "代码生成助手", this);
  }

  onAssistantTypeSelect(assistantTypeApi: AssistantTypeApi) {
    assistantTypeApi.changeFieldLabel("prompt", "遵循要求");
    assistantTypeApi.addFieldTips(
      "prompt",
      "内置生成文件内容格式和自动创建文件的命令，请勿修改模型输出遵循的格式，请指定生产",
    );
    assistantTypeApi.addField("fileScanDirectory", "文件扫描目录", "input", {
      required: true,
    });
    assistantTypeApi.addField(
      "confirmBeforeGenerate",
      "生成前确认",
      "checkbox",
      {
        required: true,
      },
    );
  }

  onAssistantTypeRun(assistantRunApi: AssistantRunApi) {
    this.answer = "";
    let isInitMessage = false;
    const assistantId = assistantRunApi.getAssistantId();
    Promise.all([
      assistantRunApi.getField(assistantId, "prompt"),
      assistantRunApi.getField(assistantId, "fileScanDirectory"),
      assistantRunApi.getField(assistantId, "confirmBeforeGenerate"),
    ]).then(([prompt, fileScanDirectory, confirmBeforeGenerate]) => {
      console.log(
        "plugin run",
        prompt,
        fileScanDirectory,
        confirmBeforeGenerate,
      );

      const newSystemPrompt =
        this.prompt + prompt + this.filePath + fileScanDirectory;
      console.log("plugin final system prompt", newSystemPrompt);

      assistantRunApi.askAssistant(
        assistantRunApi.getUserInput(),
        assistantId,
        "",
        [["stream", false]],
        newSystemPrompt,
        undefined,
        undefined,
        (
          payload: string,
          aiResponse: AiResponse,
          responseIsResponsingFunction: (isFinish: boolean) => void,
        ) => {
          if (!isInitMessage) {
            assistantRunApi.setAiResponse(
              aiResponse.add_message_id,
              "@tips-loading:正在生成对应文件",
            );
            isInitMessage = true;
          }

          createDir(fileScanDirectory, { recursive: true }).then(() => {
            console.log("plugin create dir success");

            if (payload !== "Tea::Event::MessageFinish") {
              // 更新messages的最后一个对象
              this.answer = payload;
              console.log("plugin answer", this.answer);
            } else {
              console.log("plugin answer finish", this.answer);
              // 提取多段f-start和f-end之间的内容
              const fileContents = this.answer.match(
                /@f-start:(.+?)\s+([\s\S]*?)\s+@f-end/g,
              );
              console.log("plugin file content", fileContents);

              if (fileContents) {
                for (const fileContent of fileContents) {
                  const match = /@f-start:(.+?)\s+([\s\S]*?)\s+@f-end/.exec(
                    fileContent,
                  );
                  if (match) {
                    const filePath = match[1].trim();
                    let content = match[2].trim();
                    content = content
                      .replace(/^```\w*\n([\s\S]*?)\n```$/gm, "$1")
                      .trim();

                    console.log("plugin write file", filePath, content);
                    writeTextFile(filePath, content);
                    console.log("plugin write success");
                  }
                }
              }

              assistantRunApi.setAiResponse(
                aiResponse.add_message_id,
                "@tips-success:生成完成",
              );
              console.log("plugin finish");
              responseIsResponsingFunction(false);
            }
          });
        },
      );
    });
  }
}
