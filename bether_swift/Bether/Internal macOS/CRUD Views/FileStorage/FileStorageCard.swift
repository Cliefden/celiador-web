import SwiftUI
import Supabasable
import OptionalHelpers
import Naming

struct FileStorageCard: View {
    var item: FileStorage
    @State var editItem: FileStorage?
    @State var userName: String = ""
    
    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                title: item.name,
                subtitle: item.path,
                icon: item.fileTypeIcon,
                iconColor: .blue,
                status: nil,
                statusColor: nil
            )
        } rightSide: {
            CardRightView(
                editAction: { editItem = item },
                deleteAction: {
                    Task {
                        await SBTableManager<FileStorage>.deleteFile(item.id)
                    }
                }
            )
        }
        .sheet(item: $editItem) { file in
            FileStorageAddOrEdit(itemToEdit: file)
        }
        .task {
            if let userId = item.userId {
                let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId)
                userName = profiles.first?.displayName ?? "Unknown User"
            }
        }
    }
}

#Preview {
    FileStorageCard(item: FileStorage(
        id: UUID(),
        createdAt: Date(),
        creator: nil,
        name: "example.js",
        path: "projects/123/example.js",
        size: 1024,
        mimeType: "application/javascript",
        bucketName: "project-files",
        userId: nil,
        projectId: nil
    ))
}
