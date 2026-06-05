import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*
import hudson.triggers.*

def jenkins = Jenkins.instance
def repoUrl = 'https://github.com/njoya006/Law-bridge-.git'

def createPipelineJob(String name, String branchSpec, String scriptPath) {
    if (jenkins.getItem(name) != null) {
        println "Job already exists: ${name}"
        return
    }
    def job = jenkins.createProject(WorkflowJob.class, name)
    def remote = new UserRemoteConfig(repoUrl, null, null, null)
    def branch = new BranchSpec(branchSpec)
    def scm = new GitSCM([remote], [branch], false, [], null, null, null)
    def defn = new CpsScmFlowDefinition(scm, scriptPath)
    defn.setLightweight(true)
    job.setDefinition(defn)
    job.setDescription("LawBridge CI — ${name}")
    job.addTrigger(new SCMTrigger('H/5 * * * *'))
    job.save()
    println "Created job: ${name}"
}

createPipelineJob('lawbridge-feature-ci', '*/praise/jenkins', 'jenkins/Jenkinsfile.feature')
createPipelineJob('lawbridge-main-ci', '*/main', 'jenkins/Jenkinsfile')
jenkins.save()
